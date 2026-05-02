"use client";

import { useState } from "react";
import {
  MAX_DOCUMENTS_PER_PROJECT,
  type ProjectDocument,
} from "@/types/documents";
import { DocumentUploadForm } from "./DocumentUploadForm";
import { DocumentRow } from "./DocumentRow";

interface ExchangeMessage {
  role: "user" | "assistant";
  text: string;
}

export function DocumentsPanel({
  projectId,
  documents,
}: {
  projectId: string;
  documents: ProjectDocument[];
}) {
  // selectedId tracks an *explicit* user pick. The effective selection
  // is derived: explicit pick (if still in the list) → first doc → null.
  // This way a newly-uploaded doc auto-selects on revalidation without
  // a useEffect.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Exchanges are kept in client memory only — the doc Q&A is
  // ephemeral by design (the doc is the durable artifact). Pinning
  // useful answers can be a v2 feature.
  const [exchanges, setExchanges] = useState<
    Record<string, ExchangeMessage[]>
  >({});

  const explicitId =
    selectedId && documents.some((d) => d.id === selectedId)
      ? selectedId
      : null;
  const effectiveSelectedId = explicitId ?? documents[0]?.id ?? null;
  const selectedDoc =
    documents.find((d) => d.id === effectiveSelectedId) ?? null;
  const reachedCap = documents.length >= MAX_DOCUMENTS_PER_PROJECT;
  const disabledReason = reachedCap
    ? `You've reached the ${MAX_DOCUMENTS_PER_PROJECT}-document cap for this project.`
    : null;

  async function ask() {
    if (!selectedDoc) return;
    const trimmed = question.trim();
    if (!trimmed) return;

    setError(null);
    setIsAsking(true);

    // Optimistically append the user turn.
    const next = [
      ...(exchanges[selectedDoc.id] ?? []),
      { role: "user" as const, text: trimmed },
    ];
    setExchanges((prev) => ({ ...prev, [selectedDoc.id]: next }));
    setQuestion("");

    try {
      const res = await fetch(
        `/api/projects/${projectId}/docs/ask`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: selectedDoc.id,
            question: trimmed,
          }),
        },
      );
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Document Q&A failed");
        return;
      }
      const reply = data.reply ?? "(no response)";
      setExchanges((prev) => ({
        ...prev,
        [selectedDoc.id]: [
          ...(prev[selectedDoc.id] ?? []),
          { role: "assistant", text: reply },
        ],
      }));
    } catch {
      setError("Network error. Try again.");
    } finally {
      setIsAsking(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAsking) ask();
  }

  return (
    <div data-docs-panel="true" className="mt-4 space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "var(--studio-accent)" }}
          />
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Docs
          </p>
        </div>
        <h2 className="mt-1 text-xl font-semibold text-black dark:text-white">
          Upload + ask
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Drop a PDF in here — a contract, a brief, a research paper — and
          ask the coach about it. Stays scoped to this project.
        </p>
      </header>

      <DocumentUploadForm
        projectId={projectId}
        disabledReason={disabledReason}
      />

      {documents.length === 0 ? (
        <div
          data-docs-empty="true"
          className="rounded-lg border border-dashed border-[var(--border-soft)] bg-[var(--surface)] p-6 text-center"
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No documents yet. Upload one above to start asking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
          <ul data-docs-list="true" className="space-y-2">
            {documents.map((d) => (
              <DocumentRow
                key={d.id}
                doc={d}
                projectId={projectId}
                selected={d.id === effectiveSelectedId}
                onSelect={() => setSelectedId(d.id)}
              />
            ))}
          </ul>

          <section
            data-docs-qa="true"
            className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] p-4"
          >
            {selectedDoc ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Asking about
                </p>
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  {selectedDoc.filename}
                </h3>

                <ul
                  data-docs-thread="true"
                  className="mt-4 space-y-3"
                >
                  {(exchanges[selectedDoc.id] ?? []).map((m, i) => (
                    <li
                      key={i}
                      data-docs-message-role={m.role}
                      className={
                        m.role === "user"
                          ? "rounded-md bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--foreground)]"
                          : "whitespace-pre-wrap rounded-md border border-[var(--border-soft)] bg-white px-3 py-2 text-sm text-[var(--foreground)] dark:bg-zinc-900"
                      }
                    >
                      {m.text}
                    </li>
                  ))}
                </ul>

                <form onSubmit={onSubmit} className="mt-4">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="What does this contract say about termination?"
                    data-docs-question-input="true"
                    disabled={isAsking}
                    className="block w-full resize-none rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-zinc-400 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)] disabled:opacity-50"
                  />
                  <div className="mt-2 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isAsking || question.trim().length === 0}
                      data-docs-ask-button="true"
                      className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--brand-strong)] disabled:opacity-50"
                    >
                      {isAsking ? "Reading…" : "Ask"}
                    </button>
                  </div>
                </form>

                {error && (
                  <p
                    role="alert"
                    data-docs-error="true"
                    className="mt-2 text-xs text-red-700 dark:text-red-400"
                  >
                    {error}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Pick a document on the left to start asking.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
