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
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--community-accent)" }}
        />
        Community · Failures
      </div>
      <h1 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-tight text-[var(--foreground)] sm:text-5xl">
        What didn&apos;t work.
      </h1>
      <p className="mt-4 max-w-xl text-base text-zinc-700 dark:text-zinc-300">
        A logged-in space for misses, missteps, and lessons learned the hard
        way. No likes, no rankings — just receipts from people doing the same
        thing as you. Honest beats heroic.
      </p>

      <div className="mt-8">
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
