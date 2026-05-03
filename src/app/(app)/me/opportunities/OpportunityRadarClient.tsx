"use client";

import { useState, useTransition } from "react";

interface Opportunity {
  id: string;
  title: string;
  company: string | null;
  source: "remoteok" | "wwr" | "hn-hiring";
  url: string;
  posted_at: string | null;
  excerpt: string | null;
}

const SOURCE_LABELS: Record<Opportunity["source"], string> = {
  remoteok: "Remote OK",
  wwr: "We Work Remotely",
  "hn-hiring": "HN Who's Hiring",
};

export function OpportunityRadarClient({
  initialKeyword,
}: {
  initialKeyword: string;
}) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSearched(true);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/opportunities?q=${encodeURIComponent(keyword.trim())}`,
        );
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          setError(data.error ?? "Search failed");
          return;
        }
        const data = (await res.json()) as { opportunities: Opportunity[] };
        setOpportunities(data.opportunities ?? []);
      } catch {
        setError("Network error. Try again.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={onSubmit}
        data-radar-form="true"
        className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] p-4"
      >
        <label className="block text-sm">
          <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Keyword
          </span>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            maxLength={100}
            placeholder="e.g. designer · copywriter · remote python · brand strategy"
            data-radar-keyword="true"
            className="mt-1 block w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
        </label>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Pulled live from RemoteOK, We Work Remotely, and HN Who&apos;s
            Hiring. No API keys; no extraction; just public feeds.
          </p>
          <button
            type="submit"
            disabled={isPending}
            data-radar-search-button="true"
            className="rounded-md bg-[var(--brand)] px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)] disabled:opacity-50"
          >
            {isPending ? "Scanning…" : "Scan"}
          </button>
        </div>
      </form>

      {error && (
        <p
          role="alert"
          data-radar-error="true"
          className="text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}

      {searched && !isPending && opportunities.length === 0 && !error && (
        <p
          data-radar-empty="true"
          className="rounded-lg border border-dashed border-[var(--border-soft)] bg-[var(--surface)] p-6 text-sm text-zinc-600 dark:text-zinc-400"
        >
          Nothing matched. Try a broader keyword (e.g. just &ldquo;designer&rdquo;
          instead of &ldquo;senior brand designer Lagos&rdquo;).
        </p>
      )}

      {opportunities.length > 0 && (
        <ul
          data-radar-results="true"
          className="space-y-2"
        >
          {opportunities.map((o) => (
            <li
              key={o.id}
              data-radar-opportunity-id={o.id}
              data-radar-opportunity-source={o.source}
              className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[var(--foreground)] underline-offset-2 hover:underline"
                  >
                    {o.title}
                  </a>
                  {o.company && (
                    <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {o.company}
                    </p>
                  )}
                  {o.excerpt && (
                    <p className="mt-2 line-clamp-2 text-xs text-zinc-700 dark:text-zinc-300">
                      {o.excerpt}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                  {SOURCE_LABELS[o.source]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
