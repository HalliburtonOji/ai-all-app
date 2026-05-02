import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  getAllProfessionPacks,
  getProfessionPackBySlug,
} from "@/lib/work/packs";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProfessionPackPage({ params }: PageProps) {
  const { slug } = await params;
  const pack = getProfessionPackBySlug(slug);
  if (!pack) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/me/work/packs"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← All packs
      </Link>

      <header className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Profession pack
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
          {pack.title}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
          {pack.summary}
        </p>
      </header>

      <article
        data-pack-body="true"
        data-pack-slug={pack.slug}
        className="prose prose-zinc mt-8 max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:mt-8 prose-h2:text-xl prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-strong:text-black dark:prose-strong:text-white"
      >
        <ReactMarkdown>{pack.body}</ReactMarkdown>
      </article>
    </main>
  );
}

export function generateStaticParams() {
  return getAllProfessionPacks().map((p) => ({ slug: p.slug }));
}
