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
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand)]"
        />
        Welcome
      </div>
      <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl">
        Tell us a bit about you.
      </h1>
      <p className="mt-4 max-w-xl text-base text-zinc-700 dark:text-zinc-300">
        Three short questions. Skip anything you don&apos;t want to answer —
        the coach gets sharper with whatever you share. Nothing here is
        public.
      </p>

      <div className="mt-10">
        <WelcomeWizard />
      </div>
    </main>
  );
}
