"use client";

import { useRouter } from "next/navigation";
import type { Suggestion } from "@/types/coach";

interface SuggestionTrayProps {
  suggestions: Suggestion[];
  isLoading: boolean;
  disabled: boolean;
  projectId: string;
  /** Called for default-action ("coach") suggestions: fills the textarea. */
  onSelect: (prompt: string) => void;
  onRefresh: () => void;
}

export function SuggestionTray({
  suggestions,
  isLoading,
  disabled,
  projectId,
  onSelect,
  onRefresh,
}: SuggestionTrayProps) {
  const router = useRouter();

  function handleClick(s: Suggestion) {
    if (s.action === "studio.image") {
      const params = new URLSearchParams();
      params.set("tab", "studio");
      params.set("studio", "image");
      params.set("prefill", s.prompt);
      router.push(`/projects/${projectId}?${params.toString()}`);
      return;
    }
    onSelect(s.prompt);
  }
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
          : suggestions.map((s, i) => {
              const isStudioImage = s.action === "studio.image";
              return (
                <button
                  key={`${i}-${s.label}`}
                  type="button"
                  onClick={() => handleClick(s)}
                  disabled={disabled}
                  data-suggestion-index={i}
                  data-suggestion-action={s.action ?? "coach"}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    isStudioImage
                      ? "border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-500 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:border-amber-500 dark:hover:bg-amber-950/50"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                  }`}
                >
                  {isStudioImage && (
                    <span aria-hidden className="mr-1">
                      ✶
                    </span>
                  )}
                  {s.label}
                </button>
              );
            })}
      </div>
    </div>
  );
}
