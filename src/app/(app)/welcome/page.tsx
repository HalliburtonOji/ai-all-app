import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { WelcomeWizard } from "./WelcomeWizard";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the user already has any user_facts, they've been here before
  // (or completed the wizard). Send them to the dashboard so a refresh
  // doesn't loop them back.
  if (user) {
    const { data: existing } = await supabase
      .from("user_facts")
      .select("id")
      .limit(1);
    if (existing && existing.length > 0) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Welcome
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
        Tell us a bit about you
      </h1>
      <p className="mt-2 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
        Three short questions. Skip anything you don&apos;t want to answer —
        the coach gets sharper with whatever you share. Nothing here is
        public.
      </p>

      <div className="mt-8">
        <WelcomeWizard />
      </div>
    </main>
  );
}
