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
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/me/work/packs"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← All packs
      </Link>

      <header className="mt-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--brand-strong)] shadow-sm">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--work-accent)" }}
          />
          Profession pack
        </div>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl">
          {pack.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-zinc-700 dark:text-zinc-300">
          {pack.summary}
        </p>
      </header>

      <article
        data-pack-body="true"
        data-pack-slug={pack.slug}
        className="prose prose-zinc mt-10 max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:mt-10 prose-h2:text-2xl prose-h2:tracking-tight prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-a:text-[var(--brand-strong)] prose-strong:text-[var(--foreground)]"
      >
        <ReactMarkdown>{pack.body}</ReactMarkdown>
      </article>
    </main>
  );
}

export function generateStaticParams() {
  return getAllProfessionPacks().map((p) => ({ slug: p.slug }));
}
