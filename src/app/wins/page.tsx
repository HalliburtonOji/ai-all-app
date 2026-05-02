import Link from "next/link";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { deriveUsername } from "@/lib/portfolio/username";
import { WinTile } from "./WinTile";

export const dynamic = "force-dynamic";

interface FeedRow {
  id: string;
  user_id: string;
  kind: "image" | "text" | "audio";
  prompt: string;
  content_text: string | null;
  storage_path: string | null;
  signed_url: string | null;
  created_at: string;
  username: string | null;
  like_count: number;
  liked_by_me: boolean;
}

const FEED_LIMIT = 60;

export default async function WinsFeedPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <p className="text-sm text-red-700">
          Wins feed is not configured on this server.
        </p>
      </main>
    );
  }

  // Use the SSR client to find out if a viewer is logged in (and who
  // they are, for the "liked_by_me" calculation).
  const ssr = await createClient();
  const {
    data: { user: viewer },
  } = await ssr.auth.getUser();

  // Service-role admin client: needed to (a) read studio_outputs
  // across users (the public-select RLS policy would also let an
  // anon client do this, but using admin here lets us join on
  // auth.users for usernames in one round trip), and (b) sign URLs
  // for binary outputs which works for anonymous viewers.
  const admin = createSupabaseAdminClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: outputRows } = await admin
    .from("studio_outputs")
    .select(
      "id, user_id, kind, prompt, content_text, storage_path, created_at",
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);

  const outputs = (outputRows ?? []) as Array<{
    id: string;
    user_id: string;
    kind: "image" | "text" | "audio";
    prompt: string;
    content_text: string | null;
    storage_path: string | null;
    created_at: string;
  }>;

  // Pull author email for each unique user_id.
  const userIds = Array.from(new Set(outputs.map((o) => o.user_id)));
  const userEmails: Record<string, string | null> = {};
  for (const uid of userIds) {
    try {
      const { data } = await admin.auth.admin.getUserById(uid);
      userEmails[uid] = data.user?.email ?? null;
    } catch {
      userEmails[uid] = null;
    }
  }

  // Like counts per output.
  const outputIds = outputs.map((o) => o.id);
  const likeCounts: Record<string, number> = {};
  if (outputIds.length > 0) {
    const { data: likeRows } = await admin
      .from("output_likes")
      .select("output_id")
      .in("output_id", outputIds);
    for (const r of (likeRows ?? []) as Array<{ output_id: string }>) {
      likeCounts[r.output_id] = (likeCounts[r.output_id] ?? 0) + 1;
    }
  }

  // Did the current viewer (if any) like each one?
  const myLikedSet = new Set<string>();
  if (viewer && outputIds.length > 0) {
    const { data: myLikes } = await admin
      .from("output_likes")
      .select("output_id")
      .eq("user_id", viewer.id)
      .in("output_id", outputIds);
    for (const r of (myLikes ?? []) as Array<{ output_id: string }>) {
      myLikedSet.add(r.output_id);
    }
  }

  // Hydrate signed URLs for binary outputs.
  const feed: FeedRow[] = await Promise.all(
    outputs.map(async (o) => {
      let signed_url: string | null = null;
      if (o.storage_path) {
        const { data: signed } = await admin.storage
          .from("studio-images")
          .createSignedUrl(o.storage_path, 60 * 60);
        signed_url = signed?.signedUrl ?? null;
      }
      const email = userEmails[o.user_id];
      return {
        id: o.id,
        user_id: o.user_id,
        kind: o.kind,
        prompt: o.prompt,
        content_text: o.content_text,
        storage_path: o.storage_path,
        signed_url,
        created_at: o.created_at,
        username: email ? deriveUsername(email) : null,
        like_count: likeCounts[o.id] ?? 0,
        liked_by_me: myLikedSet.has(o.id),
      };
    }),
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: "var(--community-accent)" }}
        />
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Wins
        </p>
      </div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
        What people are shipping
      </h1>
      <p className="mt-2 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
        Studio outputs creators have opted into showing publicly. Likes
        only — no comments, no follower counts, no rankings. Add
        something of your own from a Studio output&apos;s &ldquo;Add to
        portfolio&rdquo; toggle.
      </p>

      {feed.length === 0 ? (
        <div
          data-wins-empty="true"
          className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-950"
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No public outputs yet. Be the first.
          </p>
        </div>
      ) : (
        <ul
          data-wins-feed="true"
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {feed.map((f) => (
            <WinTile key={f.id} item={f} viewerLoggedIn={!!viewer} />
          ))}
        </ul>
      )}

      <footer className="mt-12 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
        <Link href="/" className="underline-offset-4 hover:underline">
          Built on AI All App
        </Link>
      </footer>
    </main>
  );
}
