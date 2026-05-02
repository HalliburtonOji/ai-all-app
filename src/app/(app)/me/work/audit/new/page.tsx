import Link from "next/link";
import { NewAuditForm } from "./NewAuditForm";

export default function NewAuditPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href="/me/work"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to Work
      </Link>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
        Audit
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
        Audit your job
      </h1>
      <p className="mt-2 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
        Five short questions. The coach will write you a personalised report —
        what AI is genuinely useful for in your role, what it isn&apos;t, and
        three concrete moves you can make over the next quarter. Skip anything
        you don&apos;t want to answer.
      </p>

      <div className="mt-8">
        <NewAuditForm />
      </div>
    </main>
  );
}
