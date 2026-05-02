"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
  projects: Array<{ id: string; name: string; type: string }>;
  conversations: Array<{ id: string; project_id: string; title: string }>;
  lessons: Array<{
    slug: string;
    title: string;
    branch: string;
    summary: string;
  }>;
  packs: Array<{ slug: string; title: string; summary: string }>;
  audits: Array<{ id: string; job_title: string }>;
  clients: Array<{ id: string; name: string; company: string | null }>;
}

const EMPTY: SearchResult = {
  projects: [],
  conversations: [],
  lessons: [],
  packs: [],
  audits: [],
  clients: [],
};

/**
 * Cmd-K (or Ctrl-K) search palette. Mounted once in the (app) layout.
 * Hidden until the user opens it via keyboard or by clicking the
 * navbar trigger. Debounced fetch against /api/search; categorised
 * results; click to navigate.
 */
export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cmd-K / Ctrl-K global toggle + Esc close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isOpenKey =
        (e.key === "k" || e.key === "K") &&
        (e.metaKey || e.ctrlKey) &&
        !e.shiftKey &&
        !e.altKey;
      if (isOpenKey) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus the input when the palette opens.
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    } else {
      // Reset state when closing so the next open starts clean.
      setQ("");
      setResults(EMPTY);
    }
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
        );
        if (res.ok) {
          const data = (await res.json()) as SearchResult;
          setResults(data);
        }
      } catch {
        // Silent — palette stays usable, results just don't update.
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => window.clearTimeout(handle);
  }, [q, open]);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) {
    // Trigger button hidden in the page but accessible. The keyboard
    // shortcut is the primary entry point; this also lets users open
    // it via a click somewhere if we wire it up later.
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-search-palette-trigger="true"
        aria-label="Open search (Cmd+K)"
        className="sr-only"
      >
        Open search
      </button>
    );
  }

  const totalResults =
    results.projects.length +
    results.conversations.length +
    results.lessons.length +
    results.packs.length +
    results.audits.length +
    results.clients.length;

  return (
    <div
      data-search-palette="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] shadow-xl"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border-soft)] px-4 py-3">
          <span aria-hidden className="text-zinc-500">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects, lessons, audits, clients…"
            data-search-palette-input="true"
            className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-zinc-400 focus:outline-none"
          />
          <kbd className="hidden rounded border border-[var(--border-soft)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline">
            Esc
          </kbd>
        </div>

        <div
          data-search-palette-results="true"
          className="max-h-[60vh] overflow-y-auto p-2"
        >
          {q.trim().length < 2 ? (
            <p className="px-3 py-4 text-sm text-zinc-500">
              Type at least 2 characters to search.
            </p>
          ) : loading ? (
            <p className="px-3 py-4 text-sm text-zinc-500">Searching…</p>
          ) : totalResults === 0 ? (
            <p
              data-search-palette-empty="true"
              className="px-3 py-4 text-sm text-zinc-500"
            >
              No results.
            </p>
          ) : (
            <div className="space-y-3">
              <ResultGroup
                label="Projects"
                count={results.projects.length}
                accent="var(--coach-accent)"
              >
                {results.projects.map((p) => (
                  <ResultRow
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    title={p.name}
                    sub={p.type}
                  />
                ))}
              </ResultGroup>

              <ResultGroup
                label="Conversations"
                count={results.conversations.length}
                accent="var(--coach-accent)"
              >
                {results.conversations.map((c) => (
                  <ResultRow
                    key={c.id}
                    onClick={() =>
                      navigate(
                        `/projects/${c.project_id}?conversation=${c.id}`,
                      )
                    }
                    title={c.title}
                    sub="open thread"
                  />
                ))}
              </ResultGroup>

              <ResultGroup
                label="Lessons"
                count={results.lessons.length}
                accent="var(--learn-accent)"
              >
                {results.lessons.map((l) => (
                  <ResultRow
                    key={l.slug}
                    onClick={() => navigate(`/learn/${l.slug}`)}
                    title={l.title}
                    sub={`${l.branch} · ${l.summary}`}
                  />
                ))}
              </ResultGroup>

              <ResultGroup
                label="Profession packs"
                count={results.packs.length}
                accent="var(--work-accent)"
              >
                {results.packs.map((p) => (
                  <ResultRow
                    key={p.slug}
                    onClick={() => navigate(`/me/work/packs/${p.slug}`)}
                    title={p.title}
                    sub={p.summary}
                  />
                ))}
              </ResultGroup>

              <ResultGroup
                label="Audits"
                count={results.audits.length}
                accent="var(--work-accent)"
              >
                {results.audits.map((a) => (
                  <ResultRow
                    key={a.id}
                    onClick={() => navigate(`/me/work/audit/${a.id}`)}
                    title={a.job_title}
                    sub="open audit"
                  />
                ))}
              </ResultGroup>

              <ResultGroup
                label="Clients"
                count={results.clients.length}
                accent="var(--earn-accent)"
              >
                {results.clients.map((c) => (
                  <ResultRow
                    key={c.id}
                    onClick={() => navigate(`/me/clients/${c.id}`)}
                    title={c.name}
                    sub={c.company ?? "client"}
                  />
                ))}
              </ResultGroup>
            </div>
          )}
        </div>

        <p className="border-t border-[var(--border-soft)] px-4 py-2 text-[10px] text-zinc-500">
          <kbd className="rounded border border-[var(--border-soft)] bg-[var(--surface-muted)] px-1 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>{" "}
          to toggle ·{" "}
          <kbd className="rounded border border-[var(--border-soft)] bg-[var(--surface-muted)] px-1 py-0.5 text-[10px] font-medium">
            Esc
          </kbd>{" "}
          to close
        </p>
      </div>
    </div>
  );
}

function ResultGroup({
  label,
  count,
  accent,
  children,
}: {
  label: string;
  count: number;
  accent: string;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div data-search-result-group={label.toLowerCase()}>
      <div className="flex items-center gap-2 px-3 pt-2">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: accent }}
        />
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </p>
      </div>
      <ul className="mt-1">{children}</ul>
    </div>
  );
}

function ResultRow({
  onClick,
  title,
  sub,
}: {
  onClick: () => void;
  title: string;
  sub?: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        data-search-result="true"
        className="flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-[var(--surface-muted)]"
      >
        <span className="text-sm font-medium text-[var(--foreground)]">
          {title}
        </span>
        {sub && (
          <span className="line-clamp-1 text-xs text-zinc-600 dark:text-zinc-400">
            {sub}
          </span>
        )}
      </button>
    </li>
  );
}

/**
 * Tiny visible affordance for the navbar — opens the palette via
 * click. The palette itself owns all the state.
 */
export function SearchPaletteTrigger() {
  return (
    <button
      type="button"
      onClick={() => {
        // Dispatch a synthetic keydown so the palette's existing
        // listener handles it. Avoids exposing a global setter.
        const evt = new KeyboardEvent("keydown", {
          key: "k",
          metaKey: true,
          ctrlKey: true,
        });
        window.dispatchEvent(evt);
      }}
      data-search-palette-trigger-button="true"
      aria-label="Search (Cmd+K)"
      className="hidden items-center gap-1.5 rounded-md border border-[var(--border-soft)] bg-transparent px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] sm:flex"
    >
      <span aria-hidden>🔍</span>
      <span>Search</span>
      <kbd className="rounded border border-[var(--border-soft)] bg-[var(--surface-muted)] px-1 py-0 text-[10px] font-medium text-zinc-500">
        ⌘K
      </kbd>
    </button>
  );
}
