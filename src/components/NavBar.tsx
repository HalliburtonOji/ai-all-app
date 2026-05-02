import Link from "next/link";
import { logout } from "@/app/auth/actions";

export function NavBar({ email }: { email: string }) {
  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/dashboard"
            className="text-base font-bold tracking-tight text-black sm:text-lg dark:text-white"
          >
            AI All App
          </Link>
          <div className="flex items-center gap-3 text-sm sm:gap-5 sm:text-base">
            <Link
              href="/dashboard"
              className="text-zinc-700 transition-colors hover:text-black dark:text-zinc-300 dark:hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/projects"
              className="text-zinc-700 transition-colors hover:text-black dark:text-zinc-300 dark:hover:text-white"
            >
              Projects
            </Link>
            <Link
              href="/learn"
              className="text-zinc-700 transition-colors hover:text-black dark:text-zinc-300 dark:hover:text-white"
            >
              Learn
            </Link>
            <Link
              href="/me/work"
              className="hidden text-zinc-700 transition-colors hover:text-black sm:inline dark:text-zinc-300 dark:hover:text-white"
            >
              Work
            </Link>
            <Link
              href="/wins"
              className="hidden text-zinc-700 transition-colors hover:text-black sm:inline dark:text-zinc-300 dark:hover:text-white"
            >
              Wins
            </Link>
            <Link
              href="/community/failures"
              className="hidden text-zinc-700 transition-colors hover:text-black md:inline dark:text-zinc-300 dark:hover:text-white"
            >
              Failures
            </Link>
            <Link
              href="/me/earnings"
              className="text-zinc-700 transition-colors hover:text-black dark:text-zinc-300 dark:hover:text-white"
            >
              Earnings
            </Link>
            <Link
              href="/me/clients"
              className="hidden text-zinc-700 transition-colors hover:text-black md:inline dark:text-zinc-300 dark:hover:text-white"
            >
              Clients
            </Link>
            <Link
              href="/me/keys"
              className="hidden text-zinc-700 transition-colors hover:text-black md:inline dark:text-zinc-300 dark:hover:text-white"
            >
              Keys
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden max-w-[180px] truncate text-sm text-zinc-500 md:inline">
            {email}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
