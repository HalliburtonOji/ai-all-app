import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-black sm:text-6xl dark:text-white">
          AI All App
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-zinc-600 sm:text-xl dark:text-zinc-400">
          Coming soon — your AI workshop, classroom, and earnings hub in one place.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-md bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-md bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 bg-white px-6 py-2 font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>

      <p className="absolute bottom-6 text-sm text-zinc-500 dark:text-zinc-500">
        Built by Halli
      </p>
    </main>
  );
}
