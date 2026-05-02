import Link from "next/link";
import { ClientForm } from "../ClientForm";

export default function NewClientPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href="/me/clients"
        className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
      >
        ← Back to clients
      </Link>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
        New client
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
        Add a client
      </h1>
      <p className="mt-2 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
        Just the basics. Everything except the name is optional — you can fill
        more in later.
      </p>

      <div className="mt-8">
        <ClientForm mode="create" />
      </div>
    </main>
  );
}
