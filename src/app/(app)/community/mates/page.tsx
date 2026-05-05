import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  type PathMateSignal,
  tagOverlap,
} from "@/types/mates";
import { deriveUsername } from "@/lib/portfolio/username";
import { PathMateForm } from "./PathMateForm";

interface SignalWithUsername extends PathMateSignal {
  username: string | null;
}

export default async function PathMatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pull current user's signal (regardless of is_public).
  const { data: ownRow } = await supabase
    .from("path_mate_signals")
    .select(
      "user_id, path, bio, tags, is_public, updated_at, created_at",
    )
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const own = (ownRow ?? null) as PathMateSignal | null;

  // Pull all other public signals.
  const { data: otherRows } = await supabase
    .from("path_mate_signals")
    .select(
      "user_id, path, bio, tags, is_public, updated_at, created_at",
    )
    .eq("is_public", true)
    .neq("user_id", user?.id ?? "")
    .order("updated_at", { ascending: false })
    .limit(60);
  const others = (otherRows ?? []) as PathMateSignal[];

  // Sort by tag overlap with the current user's tags (if any).
  const ownTags = own?.tags ?? [];
  const sorted = others
    .map((s) => ({ s, overlap: tagOverlap(ownTags, s.tags) }))
    .sort((a, b) => {
      if (a.overlap !== b.overlap) return b.overlap - a.overlap;
      return (
        new Date(b.s.updated_at).getTime() -
        new Date(a.s.updated_at).getTime()
      );
    })
    .map(({ s }) => s);

  // Resolve usernames for the listed users via the service-role admin
  // client (same pattern as the portfolio passport route).
  const idsToResolve = sorted.map((s) => s.user_id);
  let usernames: Record<string, string> = {};
  if (idsToResolve.length > 0) {
    const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (adminUrl && adminKey) {
      const admin = createServiceClient(adminUrl, adminKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      // Linear scan: fine while user count is small. Same caveat as
      // /p/<username>.
      const { data: list } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      for (const u of list?.users ?? []) {
        if (idsToResolve.includes(u.id) && u.email) {
          usernames[u.id] = deriveUsername(u.email);
        }
      }
    }
  }

  const enriched: SignalWithUsername[] = sorted.map((s) => ({
    ...s,
    username: usernames[s.user_id] ?? null,
  }));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/wins"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← All community
      </Link>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--community-accent)]"
        />
        Community · Path mates
      </div>

      <h1 className="mt-3 text-4xl font-semibold leading-[0.95] tracking-tight text-[var(--foreground)] sm:text-5xl">
        Find people on a similar path.
      </h1>
      <p className="mt-3 max-w-2xl text-base text-zinc-700 dark:text-zinc-300">
        Tag yourself; see others with overlapping tags. No follower counts, no
        leaderboards. Reach out via someone&apos;s public portfolio if a path
        looks worth comparing notes on.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* DISCOVERY LIST */}
        <section data-mates-list="true">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            On similar paths
          </h2>
          {enriched.length === 0 ? (
            <p
              data-mates-empty="true"
              className="mt-4 rounded-lg border border-dashed border-[var(--border-soft)] bg-[var(--surface)] p-6 text-sm text-zinc-700 dark:text-zinc-300"
            >
              No public signals yet. Be the first — flip your signal to public on
              the right.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {enriched.map((s) => (
                <li
                  key={s.user_id}
                  data-mate-signal-id={s.user_id}
                  className="bento-tile rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-5"
                >
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {s.path}
                  </p>
                  {s.bio && (
                    <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                      {s.bio}
                    </p>
                  )}
                  {s.tags.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {s.tags.map((t) => {
                        const matches = ownTags.some(
                          (own) => own.toLowerCase() === t.toLowerCase(),
                        );
                        return (
                          <li
                            key={t}
                            data-mate-tag={t}
                            data-mate-tag-match={matches ? "true" : "false"}
                            className={
                              "rounded-full px-2 py-0.5 text-[11px] font-medium " +
                              (matches
                                ? "bg-[var(--brand-soft)] text-[var(--brand-ink)]"
                                : "bg-[var(--surface-muted)] text-zinc-600 dark:text-zinc-400")
                            }
                          >
                            {t}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {s.username && (
                    <p className="mt-3 text-xs">
                      <Link
                        href={`/p/${s.username}`}
                        className="font-medium text-[var(--brand-strong)] underline-offset-2 hover:underline"
                      >
                        See their public portfolio →
                      </Link>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* OWN SIGNAL FORM */}
        <aside>
          <PathMateForm signal={own} />
        </aside>
      </div>
    </main>
  );
}
