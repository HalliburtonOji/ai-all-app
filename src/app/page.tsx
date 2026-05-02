import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

const LAYERS = [
  {
    id: "coach",
    label: "Coach",
    color: "var(--coach-accent)",
    blurb: "A persistent thinking partner inside every Project.",
  },
  {
    id: "learn",
    label: "Learn",
    color: "var(--learn-accent)",
    blurb: "Short, grounded lessons. No hype. No grift.",
  },
  {
    id: "studio",
    label: "Studio",
    color: "var(--studio-accent)",
    blurb: "Image, copy, and voice tools that know your context.",
  },
  {
    id: "earn",
    label: "Earn",
    color: "var(--earn-accent)",
    blurb: "Portfolio, income tracker, pricing helper, clients.",
  },
  {
    id: "community",
    label: "Community",
    color: "var(--community-accent)",
    blurb: "Wins feed and a quiet failure forum. No follower counts.",
  },
  {
    id: "work",
    label: "Work",
    color: "var(--work-accent)",
    blurb: "Audit your job. Profession packs that aren't doom takes.",
  },
] as const;

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="bg-canvas relative flex min-h-screen flex-col items-center px-6 pb-16 pt-20 sm:pt-28">
      <div className="relative w-full max-w-4xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand)]"
          />
          A creator OS — wholesome, grounded, anti-hype
        </div>

        <h1 className="mt-6 text-5xl font-bold tracking-tight text-black sm:text-6xl md:text-7xl dark:text-white">
          Get genuinely good at AI.
          <br />
          <span className="text-[var(--brand-strong)]">Use it. Earn from it.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-700 sm:text-xl dark:text-zinc-300">
          Workshop, classroom, and earnings hub in one place. Built for
          people who want to learn AI, do real work with it, and earn from
          it — without the doom-scrolling or the 50 K-influencer noise.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-[var(--brand)] px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)]"
            >
              Go to your dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-md bg-[var(--brand)] px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)]"
              >
                Sign up — free tier
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-6 py-2.5 font-medium text-[var(--foreground)] shadow-sm transition-colors hover:bg-[var(--surface-muted)]"
              >
                I already have an account
              </Link>
            </>
          )}
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Free tier is actually useful. Bring your own API keys (BYOK) if you
          want unlimited.
        </p>
      </div>

      <section className="mt-20 w-full max-w-5xl">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Six layers, one app
        </h2>
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LAYERS.map((l) => (
            <li
              key={l.id}
              className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--border-strong)]"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: l.color }}
                />
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  {l.label}
                </h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {l.blurb}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20 w-full max-w-3xl rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Wholesome charter
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-zinc-700 sm:grid-cols-2 dark:text-zinc-300">
          <li>• No fearmongering, no AI-doom takes, no fake countdowns.</li>
          <li>• Honest failure stories alongside wins.</li>
          <li>• Free tier that&apos;s actually useful.</li>
          <li>• Anti-guru. Real practitioners with verified results.</li>
          <li>• Disclose-AI when it matters. Always.</li>
          <li>• Africa-aware, not Africa-only.</li>
        </ul>
      </section>

      <p className="mt-16 text-sm text-zinc-500">Built by Halli</p>
    </main>
  );
}
