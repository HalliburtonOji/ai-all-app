"use client";

import type { Suggestion } from "@/types/coach";

interface SuggestionTrayProps {
  suggestions: Suggestion[];
  isLoading: boolean;
  disabled: boolean;
  onSelect: (prompt: string) => void;
  onRefresh: () => void;
}

export function SuggestionTray({
  suggestions,
  isLoading,
  disabled,
  onSelect,
  onRefresh,
}: SuggestionTrayProps) {
  // Render nothing when there are no suggestions and we're not loading —
  // keeps the empty/fresh-thread state from showing tray clutter.
  if (!isLoading && suggestions.length === 0) return null;

  return (
    <div
      data-suggestion-tray="true"
      className="border-t border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Suggested next steps
        </span>
        <button
          type="button"
          aria-label="Refresh suggestions"
          onClick={onRefresh}
          disabled={disabled || isLoading}
          className="text-[10px] text-zinc-500 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                aria-hidden
                className="h-7 w-32 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-900"
              />
            ))
          : suggestions.map((s, i) => (
              <button
                key={`${i}-${s.label}`}
                type="button"
                onClick={() => onSelect(s.prompt)}
                disabled={disabled}
                data-suggestion-index={i}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
              >
                {s.label}
              </button>
            ))}
      </div>
    </div>
  );
}
