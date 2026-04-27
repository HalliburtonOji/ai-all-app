import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/auth/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl dark:text-white">
          Welcome, {user.email}
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base text-zinc-600 dark:text-zinc-400">
          You&apos;re logged in. The full dashboard is coming soon.
        </p>
        <form action={logout} className="mt-8">
          <button
            type="submit"
            className="rounded-md bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}
