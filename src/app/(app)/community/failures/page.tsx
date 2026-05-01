import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { deriveUsername } from "@/lib/portfolio/username";
import { PostFailureForm } from "./PostFailureForm";
import { FailureRow } from "./FailureRow";

export const dynamic = "force-dynamic";

const FEED_LIMIT = 100;

export default async function FailureForumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pull the feed via the user's session — RLS only lets authenticated
  // users see all rows.
  const { data: noteRows } = await supabase
    .from("failure_notes")
    .select("id, user_id, body, created_at")
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);

  const notes = (noteRows ?? []) as Array<{
    id: string;
    user_id: string;
    body: string;
    created_at: string;
  }>;

  // Resolve usernames in one batch via the admin client (auth.users
  // is restricted from app reads). Anonymous users never reach this
  // page so we always have one.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const usernamesById: Record<string, string | null> = {};
  if (url && serviceRole) {
    const admin = createSupabaseAdminClient(url, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const uniqueIds = Array.from(new Set(notes.map((n) => n.user_id)));
    for (const uid of uniqueIds) {
      try {
        const { data } = await admin.auth.admin.getUserById(uid);
        usernamesById[uid] = data.user?.email
          ? deriveUsername(data.user.email)
          : null;
      } catch {
        usernamesById[uid] = null;
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Community
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
        Failure forum
      </h1>
      <p className="mt-2 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
        A logged-in space for what didn&apos;t work. No likes, no
        rankings — just receipts and reflections from people doing the
        same thing as you. Honest beats heroic.
      </p>

      <div className="mt-6">
        <PostFailureForm />
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-black dark:text-white">
          Recent
        </h2>
        {notes.length === 0 ? (
          <p
            data-failures-empty="true"
            className="mt-3 rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
          >
            Nothing yet. Be the first to write what didn&apos;t work
            this week.
          </p>
        ) : (
          <ul data-failures-feed="true" className="mt-3 space-y-3">
            {notes.map((n) => (
              <FailureRow
                key={n.id}
                id={n.id}
                body={n.body}
                username={usernamesById[n.user_id] ?? null}
                createdAt={n.created_at}
                isOwner={!!user && user.id === n.user_id}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
