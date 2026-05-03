import "server-only";

/**
 * Opportunity radar — server-side aggregator that pulls from a few
 * public job/gig feeds, normalises into a single shape, and filters
 * by keyword. No external API keys required.
 *
 * v1 sources:
 *   - RemoteOK JSON API (https://remoteok.com/api) — tech-heavy.
 *   - We Work Remotely RSS — broader (programming, design, copy).
 *   - HN Algolia search ("hiring" tag) — once-a-month "who is hiring"
 *     threads, broken out as story comments.
 *
 * Each source is best-effort: a single source failing doesn't break
 * the others. We cap each source at 15 results pre-filter, then
 * apply the user's keyword filter and merge.
 */

export interface Opportunity {
  id: string; // stable id within the radar (source + url-derived)
  title: string;
  company: string | null;
  source: "remoteok" | "wwr" | "hn-hiring";
  url: string;
  posted_at: string | null; // ISO if known
  excerpt: string | null;
}

const PER_SOURCE_CAP = 15;
const TOTAL_CAP = 30;
const FETCH_TIMEOUT_MS = 6_000;

async function fetchWithTimeout(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Some feeds (looking at you RemoteOK) reject default UA.
        "user-agent": "ai-all-app-opportunity-radar/1.0 (+https://ai-all-app.vercel.app)",
        accept: "application/json,text/xml,*/*;q=0.1",
      },
    });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

interface RemoteOkRow {
  id?: number | string;
  position?: string;
  company?: string;
  url?: string;
  apply_url?: string;
  date?: string;
  description?: string;
}

async function fetchRemoteOk(): Promise<Opportunity[]> {
  const res = await fetchWithTimeout("https://remoteok.com/api");
  if (!res) return [];
  let rows: unknown;
  try {
    rows = await res.json();
  } catch {
    return [];
  }
  if (!Array.isArray(rows)) return [];
  // RemoteOK's first element is metadata; skip it.
  const items = (rows as RemoteOkRow[]).slice(1, 1 + PER_SOURCE_CAP);
  return items
    .filter((r) => r.position && (r.url || r.apply_url))
    .map((r) => ({
      id: `remoteok-${r.id ?? r.url ?? Math.random()}`,
      title: (r.position ?? "").slice(0, 200),
      company: r.company ? r.company.slice(0, 200) : null,
      source: "remoteok" as const,
      url: r.apply_url ?? r.url ?? "",
      posted_at: r.date ?? null,
      excerpt: r.description ? stripHtml(r.description).slice(0, 200) : null,
    }));
}

async function fetchWeWorkRemotely(): Promise<Opportunity[]> {
  const res = await fetchWithTimeout("https://weworkremotely.com/remote-jobs.rss");
  if (!res) return [];
  let xml: string;
  try {
    xml = await res.text();
  } catch {
    return [];
  }
  return parseRssItems(xml, "wwr").slice(0, PER_SOURCE_CAP);
}

async function fetchHnHiring(query: string): Promise<Opportunity[]> {
  // Algolia HN search: comments mentioning the query, on "who is
  // hiring" threads. Threads themselves are stories tagged "hiring".
  // We search comments because the actual postings are comments.
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=comment,story_4071230&hitsPerPage=${PER_SOURCE_CAP}`;
  // story_4071230 is a known seasonal "Ask HN: Who is hiring?" id;
  // it's mostly illustrative. The query alone is decent enough at
  // surfacing recent hiring threads via the "hiring" keyword.
  const fallbackUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(`${query} hiring`)}&hitsPerPage=${PER_SOURCE_CAP}`;
  const res = (await fetchWithTimeout(url)) ?? (await fetchWithTimeout(fallbackUrl));
  if (!res) return [];
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return [];
  }
  const obj = data as { hits?: Array<Record<string, unknown>> };
  if (!obj.hits) return [];
  return obj.hits
    .map((h) => {
      const id =
        (h.objectID as string) ??
        (h.story_id as string | undefined) ??
        Math.random().toString();
      const title =
        ((h.title as string | undefined) ?? (h.story_title as string | undefined) ?? "").slice(0, 200);
      const text = (h.comment_text as string | undefined) ?? "";
      return {
        id: `hn-${id}`,
        title: title || "HN posting",
        company: null,
        source: "hn-hiring" as const,
        url: `https://news.ycombinator.com/item?id=${id}`,
        posted_at: (h.created_at as string | undefined) ?? null,
        excerpt: stripHtml(text).slice(0, 200),
      };
    })
    .filter((o) => !!o.url);
}

/** Minimal RSS <item> parser — title, link, pubDate, description. */
function parseRssItems(xml: string, source: "wwr"): Opportunity[] {
  const items: Opportunity[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = matchTag(block, "title");
    const link = matchTag(block, "link");
    const pubDate = matchTag(block, "pubDate");
    const description = matchTag(block, "description");
    if (!title || !link) continue;
    items.push({
      id: `${source}-${link}`,
      title: stripHtml(title).slice(0, 200),
      company: null,
      source,
      url: link,
      posted_at: pubDate ? new Date(pubDate).toISOString() : null,
      excerpt: description ? stripHtml(description).slice(0, 200) : null,
    });
  }
  return items;
}

function matchTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(block);
  if (!m) return null;
  // Strip CDATA wrappers.
  return m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/m, "$1").trim();
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Search across all sources for a single keyword. Returns the
 * top TOTAL_CAP merged results, sorted by source then title.
 *
 * In E2E_TEST_MODE this returns deterministic mock rows so tests
 * don't depend on the live feeds.
 */
export async function searchOpportunities(
  keyword: string,
): Promise<Opportunity[]> {
  const trimmed = keyword.trim();
  if (process.env.E2E_TEST_MODE === "true") {
    return [
      {
        id: "mock-remoteok-1",
        title: `[mock-radar] Remote ${trimmed || "engineer"} — Acme Co.`,
        company: "Acme Co.",
        source: "remoteok",
        url: "https://example.test/mock-1",
        posted_at: new Date().toISOString(),
        excerpt: `[mock-radar] keyword: ${trimmed.slice(0, 80)}`,
      },
      {
        id: "mock-wwr-1",
        title: `[mock-radar] Senior ${trimmed || "designer"} — Globex`,
        company: "Globex",
        source: "wwr",
        url: "https://example.test/mock-2",
        posted_at: new Date().toISOString(),
        excerpt: `[mock-radar] keyword: ${trimmed.slice(0, 80)}`,
      },
      {
        id: "mock-hn-1",
        title: `[mock-radar] HN: ${trimmed || "remote freelance"} gig`,
        company: null,
        source: "hn-hiring",
        url: "https://example.test/mock-3",
        posted_at: new Date().toISOString(),
        excerpt: `[mock-radar] keyword: ${trimmed.slice(0, 80)}`,
      },
    ];
  }

  // Run sources in parallel; each returns [] on failure.
  const [remoteok, wwr, hn] = await Promise.all([
    fetchRemoteOk(),
    fetchWeWorkRemotely(),
    trimmed ? fetchHnHiring(trimmed) : Promise.resolve([]),
  ]);

  const lower = trimmed.toLowerCase();
  // RemoteOK + WWR aren't pre-filtered; apply the keyword now.
  const matchesKeyword = (o: Opportunity) =>
    !lower ||
    o.title.toLowerCase().includes(lower) ||
    (o.company ?? "").toLowerCase().includes(lower) ||
    (o.excerpt ?? "").toLowerCase().includes(lower);

  const merged = [
    ...remoteok.filter(matchesKeyword),
    ...wwr.filter(matchesKeyword),
    ...hn,
  ];

  // Dedupe by id then cap.
  const seen = new Set<string>();
  const deduped: Opportunity[] = [];
  for (const o of merged) {
    if (seen.has(o.id)) continue;
    seen.add(o.id);
    deduped.push(o);
    if (deduped.length >= TOTAL_CAP) break;
  }
  return deduped;
}
