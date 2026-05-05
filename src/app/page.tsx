import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getTranslator } from "@/lib/i18n/get-locale";

const LAYERS = [
  {
    id: "coach",
    label: "Coach",
    color: "var(--coach-accent)",
    blurb:
      "A second mind on every Project. Knows your context. Suggests next moves. Never demands.",
    href: "/signup",
    span: "lg:col-span-2 lg:row-span-1",
  },
  {
    id: "studio",
    label: "Studio",
    color: "var(--studio-accent)",
    blurb:
      "Image, copy, and voice tools that share your project's memory. Generate. Refine. Add to your portfolio.",
    href: "/signup",
    span: "lg:col-span-1 lg:row-span-2",
    image: true,
  },
  {
    id: "learn",
    label: "Learn",
    color: "var(--learn-accent)",
    blurb:
      "20 short lessons across 5 branches. Tutor mode on every page. Skip what you already know.",
    href: "/learn",
    span: "lg:col-span-1 lg:row-span-1",
  },
  {
    id: "earn",
    label: "Earn",
    color: "var(--earn-accent)",
    blurb:
      "Income tracker, pricing helper, client CRM, public portfolio. Show what you made and what it earned.",
    href: "/signup",
    span: "lg:col-span-1 lg:row-span-1",
  },
  {
    id: "community",
    label: "Community",
    color: "var(--community-accent)",
    blurb:
      "Wins feed and a quiet failure forum. No follower counts. No engagement bait.",
    href: "/wins",
    span: "lg:col-span-1 lg:row-span-1",
  },
  {
    id: "work",
    label: "Work",
    color: "var(--work-accent)",
    blurb:
      "Audit your job. Profession packs that aren't doom takes.",
    href: "/signup",
    span: "lg:col-span-1 lg:row-span-1",
  },
] as const;

export default async function Home() {
  const { t } = await getTranslator();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="bg-hero-stage relative overflow-hidden">
      {/* HERO ──────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 sm:pt-28 lg:pb-32">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)]/80 px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm backdrop-blur">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand)]"
              />
              {t("home.kicker")}
            </div>

            <h1 className="mt-6 text-[2.75rem] font-semibold leading-[0.95] tracking-tight text-[var(--foreground)] sm:text-6xl lg:text-7xl">
              {t("home.h1.line1")}
              <br />
              <span className="font-medium text-[var(--brand-strong)]">
                {t("home.h1.line2")}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-zinc-700 sm:text-lg dark:text-zinc-300">
              {t("home.subhead")}
            </p>

            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              {user ? (
                <Link
                  href="/dashboard"
                  className="rounded-md bg-[var(--brand)] px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--brand-strong)] hover:shadow-md"
                >
                  {t("home.cta.dashboard")}
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="rounded-md bg-[var(--brand)] px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--brand-strong)] hover:shadow-md"
                  >
                    {t("home.cta.signup")}
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-md border border-[var(--border-soft)] bg-[var(--surface)]/60 px-6 py-3 text-sm font-medium text-[var(--foreground)] backdrop-blur transition-colors hover:bg-[var(--surface-muted)]"
                  >
                    {t("home.cta.login")}
                  </Link>
                </>
              )}
            </div>

            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
              Free tier is actually useful. BYOK whenever you want unlimited.
            </p>
          </div>

          {/* Hero artwork — generated via Replicate FLUX. The torus PNG
              sits on a dark plate; the ambient glow underneath drifts so
              the whole composition feels alive. */}
          <div
            aria-hidden
            className="relative mx-auto aspect-[16/12] w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[#070707] shadow-2xl shadow-black/40"
          >
            <div
              className="hero-glow absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 55%, color-mix(in srgb, var(--brand) 55%, transparent) 0%, transparent 55%)",
              }}
            />
            <Image
              src="/landing/hero.png"
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 560px"
              className="relative object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* THE LOOP ──────────────────────────────────────────────────── */}
      <section className="relative border-t border-[var(--border-soft)] bg-[var(--surface)]/40 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-zinc-50 shadow-xl shadow-black/5 dark:bg-zinc-100 dark:shadow-black/20">
            <Image
              src="/landing/loop.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 85vw, 480px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-strong)]">
              {t("home.loop.label")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-[2.5rem]">
              {t("home.loop.heading")}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-700 dark:text-zinc-300">
              {t("home.loop.body")}
            </p>
          </div>
        </div>
      </section>

      {/* BENTO GRID ────────────────────────────────────────────────── */}
      <section className="relative border-t border-[var(--border-soft)]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {t("home.layers.heading")}
            </h2>
            <span aria-hidden className="text-xs text-zinc-500">
              01 — 06
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[180px] lg:grid-cols-3">
            {LAYERS.map((l) => (
              <Link
                key={l.id}
                href={l.href}
                className={`bento-tile group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-6 ${l.span}`}
              >
                {/* Studio tile: the translucent-panels artwork sits
                    behind the right half. Text on the left, image
                    framed on the right. */}
                {"image" in l && l.image && (
                  <>
                    <Image
                      src="/landing/studio.png"
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 90vw, 320px"
                      className="absolute inset-0 -z-0 object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 -z-0 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/85 to-[var(--surface)]/30"
                    />
                  </>
                )}
                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: l.color }}
                    />
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">
                      {l.label}
                    </h3>
                  </div>
                  <p className="mt-3 max-w-md text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                    {l.blurb}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="relative z-10 mt-6 inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-strong)] opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Open
                  <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* WHOLESOME CHARTER (editorial) ─────────────────────────────── */}
      <section className="relative border-t border-[var(--border-soft)] bg-[var(--surface)]/40">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
            {t("home.charter.heading")}
          </h2>
          <ul className="mt-12 space-y-8">
            {[
              t("home.charter.line1"),
              t("home.charter.line2"),
              t("home.charter.line3"),
              t("home.charter.line4"),
            ].map((line, i) => (
              <li key={i} className="group">
                <div className="editorial-rule mb-4" />
                <p className="flex items-baseline gap-4 text-lg leading-8 text-zinc-800 sm:text-xl dark:text-zinc-200">
                  <span
                    aria-hidden
                    className="font-mono text-xs font-semibold text-[var(--brand-strong)]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{line}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* GITHUB LINE ───────────────────────────────────────────────── */}
      <section className="relative border-t border-[var(--border-soft)]">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-6 py-14 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--foreground)]"
            >
              {/* Inline GitHub mark — saves a network request. */}
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="h-5 w-5"
                fill="currentColor"
              >
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.34-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.17a10.96 10.96 0 0 1 5.76 0c2.2-1.48 3.16-1.17 3.16-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56 4.56-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5Z" />
              </svg>
            </span>
            <p className="text-base font-medium text-[var(--foreground)]">
              {t("home.github.line")}
            </p>
          </div>
          <Link
            href="https://github.com/HalliburtonOji/ai-all-app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[var(--brand-strong)] underline-offset-4 hover:underline"
          >
            {t("home.github.cta")}
          </Link>
        </div>
      </section>

      {/* FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="relative border-t border-[var(--border-soft)] bg-[var(--surface)]/40">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
            {t("home.final.heading")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-700 dark:text-zinc-300">
            {t("home.final.body")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-md bg-[var(--brand)] px-7 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--brand-strong)] hover:shadow-md"
              >
                {t("home.cta.dashboard")}
              </Link>
            ) : (
              <Link
                href="/signup"
                className="rounded-md bg-[var(--brand)] px-7 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--brand-strong)] hover:shadow-md"
              >
                {t("home.cta.signup")}
              </Link>
            )}
          </div>
          <p className="mt-12 text-xs text-zinc-500">
            Built by Halli · With Claude · Hosted on Vercel
          </p>
        </div>
      </section>
    </main>
  );
}
