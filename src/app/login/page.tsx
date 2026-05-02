import Link from "next/link";
import { login, loginWithGoogle } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

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
          Welcome back
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to pick up where you left off.
        </p>

        {message && (
          <p className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
            {message}
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}

        <form action={login} className="space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2 text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-[var(--brand)] py-2 font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)]"
          >
            Log in
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
            Sign in with Google
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-black underline dark:text-white"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
