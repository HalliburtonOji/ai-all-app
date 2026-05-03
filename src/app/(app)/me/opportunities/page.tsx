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
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: "var(--earn-accent)" }}
        />
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Opportunity radar
        </p>
      </div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
        Find work from public feeds
      </h1>
      <p className="mt-2 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
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
