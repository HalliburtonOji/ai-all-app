import Image from "next/image";
import Link from "next/link";
import { login, loginWithGoogle } from "@/app/auth/actions";
import { getTranslator } from "@/lib/i18n/get-locale";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const { t } = await getTranslator();

  return (
    <main className="bg-hero-stage relative grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1fr]">
      {/* Form column */}
      <section className="flex flex-col items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-12 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]"
          >
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full bg-[var(--brand)]"
            />
            AI All App
          </Link>

          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl">
            {t("auth.login.heading")}
          </h1>
          <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
            {t("auth.login.subhead")}
          </p>

          {message && (
            <p className="mt-6 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}

          <form action={login} className="mt-8 space-y-3">
            <input
              name="email"
              type="email"
              required
              placeholder={t("auth.placeholder.email")}
              className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
            />
            <input
              name="password"
              type="password"
              required
              placeholder={t("auth.placeholder.password")}
              className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
            />
            <button
              type="submit"
              className="w-full rounded-md bg-[var(--brand)] py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--brand-strong)] hover:shadow-md"
            >
              {t("auth.login.button")}
            </button>
          </form>

          <div className="my-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--border-soft)]" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              or
            </span>
            <div className="h-px flex-1 bg-[var(--border-soft)]" />
          </div>

          <form action={loginWithGoogle}>
            <button
              type="submit"
              className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
            >
              {t("auth.login.google")}
            </button>
          </form>

          <p className="mt-8 text-sm text-zinc-700 dark:text-zinc-300">
            {t("auth.login.no_account")}{" "}
            <Link
              href="/signup"
              className="font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
            >
              {t("auth.login.signup_link")}
            </Link>
          </p>
        </div>
      </section>

      {/* Visual column — same teal torus from the landing hero so the
          two surfaces feel continuous. Hidden on mobile to keep the
          form above the fold. */}
      <aside
        aria-hidden
        className="relative hidden overflow-hidden border-l border-[var(--border-soft)] bg-[#070707] lg:block"
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
          sizes="50vw"
          className="relative object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </aside>
    </main>
  );
}
