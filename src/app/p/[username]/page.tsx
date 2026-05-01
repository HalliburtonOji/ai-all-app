import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { deriveUsername } from "@/lib/portfolio/username";
import type { StudioOutput } from "@/types/studio";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function PortfolioPage({ params }: PageProps) {
  const { username: rawUsername } = await params;
  const username = deriveUsername(rawUsername);
  if (!username) notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) notFound();

  // Service-role client: needed both to scan auth.users (always
  // restricted) and to read public studio_outputs without an auth
  // session. RLS still applies — the public-select policy only
  // matches rows where is_public = true.
  const admin = createSupabaseAdminClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find the user whose sanitized email prefix matches the URL slug.
  // Page through auth.users; in this MVP a linear scan is fine because
  // the user count is small. Switch to a proper username column when
  // it stops being.
  const { data: usersPage } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const matchedUser = usersPage?.users.find(
    (u) => u.email && deriveUsername(u.email) === username,
  );
  if (!matchedUser) notFound();

  // Fetch this user's public outputs. Newest first, capped.
  const { data: outputRows } = await admin
    .from("studio_outputs")
    .select(
      "id, project_id, kind, prompt, content_text, storage_path, model, metadata, is_public, created_at",
    )
    .eq("user_id", matchedUser.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(60);

  const outputs: StudioOutput[] = await Promise.all(
    ((outputRows ?? []) as Array<Omit<StudioOutput, "signed_url">>).map(
      async (row) => {
        if (!row.storage_path) return { ...row, signed_url: null };
        const { data: signed } = await admin.storage
          .from("studio-images")
          .createSignedUrl(row.storage_path, 60 * 60);
        return { ...row, signed_url: signed?.signedUrl ?? null };
      },
    ),
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Portfolio
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
          {username}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {outputs.length === 0
            ? "Nothing public yet."
            : `${outputs.length} public ${outputs.length === 1 ? "piece" : "pieces"}.`}
        </p>
      </header>

      {outputs.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-950"
          data-portfolio-empty="true"
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This creator hasn&apos;t shared anything to their portfolio yet.
          </p>
        </div>
      ) : (
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-portfolio-grid="true"
        >
          {outputs.map((o) => (
            <PortfolioTile key={o.id} output={o} />
          ))}
        </ul>
      )}

      <footer className="mt-12 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
        <Link
          href="/"
          className="underline-offset-4 hover:underline"
        >
          Built on AI All App
        </Link>
      </footer>
    </main>
  );
}

function PortfolioTile({ output }: { output: StudioOutput }) {
  const tileClass =
    "overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";
  const dataAttrs = {
    "data-portfolio-output-id": output.id,
    "data-portfolio-output-kind": output.kind,
  };

  if (output.kind === "image" && output.signed_url) {
    return (
      <li className={tileClass} {...dataAttrs}>
        <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-900">
          <Image
            src={output.signed_url}
            alt={output.prompt}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <p
          className="line-clamp-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300"
          title={output.prompt}
        >
          {output.prompt}
        </p>
      </li>
    );
  }

  if (output.kind === "text" && output.content_text) {
    return (
      <li className={`${tileClass} p-4`} {...dataAttrs}>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {(output.metadata?.kind_hint as string) ?? "general"} draft
        </p>
        <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm text-black dark:text-white">
          {output.content_text}
        </p>
      </li>
    );
  }

  if (output.kind === "audio" && output.signed_url) {
    return (
      <li className={`${tileClass} p-4`} {...dataAttrs}>
        <audio
          controls
          preload="metadata"
          src={output.signed_url}
          className="w-full"
        />
        {output.content_text && (
          <p className="mt-2 line-clamp-3 text-xs italic text-zinc-700 dark:text-zinc-300">
            &ldquo;{output.content_text}&rdquo;
          </p>
        )}
      </li>
    );
  }

  return null;
}
