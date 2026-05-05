import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import type { UserFact } from "@/types/coach";
import { OpportunityRadarClient } from "./OpportunityRadarClient";

/**
 * Pull a default keyword from the user's pinned profile facts. If
 * they said "I'm a freelance designer in Lagos", we seed the radar
 * with "designer". Falls back to empty string if nothing matches.
 */
function seedKeywordFromFacts(facts: UserFact[]): string {
  const TRIGGER_NOUNS = [
    "designer",
    "developer",
    "engineer",
    "writer",
    "marketer",
    "copywriter",
    "illustrator",
    "videographer",
    "editor",
    "researcher",
    "analyst",
    "manager",
    "consultant",
    "teacher",
    "translator",
  ];
  for (const f of facts) {
    const lower = f.fact.toLowerCase();
    for (const noun of TRIGGER_NOUNS) {
      if (lower.includes(noun)) return noun;
    }
  }
  return "";
}

export default async function OpportunityRadarPage() {
  const supabase = await createClient();

  const { data: factRows } = await supabase
    .from("user_facts")
    .select("id, fact, pinned, created_at")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  const facts = (factRows ?? []) as UserFact[];
  const seed = seedKeywordFromFacts(facts);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--earn-accent)" }}
        />
        Earn · Opportunity radar
      </div>
      <h1 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-tight text-[var(--foreground)] sm:text-5xl">
        Find work from public feeds.
      </h1>
      <p className="mt-4 max-w-2xl text-base text-zinc-700 dark:text-zinc-300">
        A read-only scan of public job and gig feeds. No platforms-that-charge,
        no &ldquo;exclusive&rdquo; gated lists, no inflated promises. The
        radar surfaces what&apos;s out there; you decide whether it&apos;s
        worth your time.
      </p>

      <div className="mt-6">
        <OpportunityRadarClient initialKeyword={seed} />
      </div>

      <p className="mt-10 text-xs text-zinc-500 dark:text-zinc-500">
        <Link
          href="/me/earnings"
          className="underline-offset-2 hover:underline"
        >
          ← Back to earnings
        </Link>
      </p>
    </main>
  );
}
