import Link from "next/link";
import { getAllProfessionPacks } from "@/lib/work/packs";

export default function PacksCatalogPage() {
  const packs = getAllProfessionPacks();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/me/work"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to Work
      </Link>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
        Profession packs
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
        Curated guides by role
      </h1>
      <p className="mt-2 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
        Each pack is a short, opinionated take on a profession — what AI is
        actually useful for in that role, what it can&apos;t do, and three
        concrete moves to make AI a strength. More packs added over time.
      </p>

      {packs.length === 0 ? (
        <p
          data-packs-empty="true"
          className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950"
        >
          No packs yet.
        </p>
      ) : (
        <ul
          data-packs-list="true"
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {packs.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/me/work/packs/${p.slug}`}
                data-pack-card={p.slug}
                className="block h-full rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
              >
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  {p.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {p.summary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
