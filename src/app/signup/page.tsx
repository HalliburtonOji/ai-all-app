import Link from "next/link";
import { signup, loginWithGoogle } from "@/app/auth/actions";
import { getTranslator } from "@/lib/i18n/get-locale";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { t } = await getTranslator();

  return (
    <main className="bg-canvas relative flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-sm font-medium text-[var(--brand-strong)]"
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full bg-[var(--brand)]"
          />
          AI All App
        </Link>
        <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-black dark:text-white">
          {t("auth.signup.heading")}
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {t("auth.signup.subhead")}
        </p>

        {error && (
          <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}

        <form action={signup} className="space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder={t("auth.placeholder.email")}
            className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder={t("auth.placeholder.password")}
            className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-[var(--brand)] py-2 font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)]"
          >
            {t("auth.signup.button")}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-xs text-zinc-500">OR</span>
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <form action={loginWithGoogle}>
          <button
            type="submit"
            className="w-full rounded-md border border-zinc-300 bg-white py-2 font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            {t("auth.signup.google")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {t("auth.signup.has_account")}{" "}
          <Link
            href="/login"
            className="font-medium text-black underline dark:text-white"
          >
            {t("auth.signup.login_link")}
          </Link>
        </p>
      </div>
    </main>
  );
}
