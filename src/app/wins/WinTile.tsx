"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";

interface WinItem {
  id: string;
  kind: "image" | "text" | "audio";
  prompt: string;
  content_text: string | null;
  signed_url: string | null;
  username: string | null;
  like_count: number;
  liked_by_me: boolean;
}

export function WinTile({
  item,
  viewerLoggedIn,
}: {
  item: WinItem;
  viewerLoggedIn: boolean;
}) {
  const [liked, setLiked] = useState(item.liked_by_me);
  const [count, setCount] = useState(item.like_count);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (!viewerLoggedIn) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/wins/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outputId: item.id }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          liked: boolean;
          likeCount: number;
        };
        setLiked(data.liked);
        setCount(data.likeCount);
      } catch {
        // Ignore — user can retry.
      }
    });
  }

  return (
    <li
      data-win-id={item.id}
      data-win-kind={item.kind}
      className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
    >
      {item.kind === "image" && item.signed_url && (
        <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-900">
          <Image
            src={item.signed_url}
            alt={item.prompt}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}

      {item.kind === "text" && item.content_text && (
        <div className="px-4 pt-4">
          <p className="line-clamp-6 whitespace-pre-wrap text-sm text-black dark:text-white">
            {item.content_text}
          </p>
        </div>
      )}

      {item.kind === "audio" && item.signed_url && (
        <div className="px-4 pt-4">
          <audio
            controls
            preload="metadata"
            src={item.signed_url}
            className="w-full"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col justify-between gap-2 p-4">
        <p
          className="line-clamp-2 text-xs text-zinc-700 dark:text-zinc-300"
          title={item.prompt}
        >
          {item.prompt}
        </p>
        <div className="flex items-center justify-between">
          {item.username ? (
            <Link
              href={`/p/${item.username}`}
              className="text-xs text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              by {item.username}
            </Link>
          ) : (
            <span aria-hidden />
          )}

          <button
            type="button"
            onClick={toggle}
            disabled={!viewerLoggedIn || isPending}
            data-win-like-button="true"
            data-win-liked={liked ? "true" : "false"}
            aria-label={liked ? "Unlike" : "Like"}
            title={
              viewerLoggedIn
                ? liked
                  ? "Unlike"
                  : "Like"
                : "Log in to like"
            }
            className={
              liked
                ? "flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-800 transition-colors disabled:opacity-50 dark:bg-rose-950/40 dark:text-rose-300"
                : "flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:border-rose-400 hover:text-rose-700 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-rose-700 dark:hover:text-rose-300"
            }
          >
            <span aria-hidden>{liked ? "♥" : "♡"}</span>
            <span data-win-like-count={count}>{count}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
