"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/utils/supabase/server";
import {
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_DOCUMENTS_PER_PROJECT,
} from "@/types/documents";

const BUCKET = "project-documents";
const ALLOWED_MIME = "application/pdf";

export interface UploadDocumentResult {
  documentId?: string;
  filename?: string;
  error?: string;
}

/**
 * Upload a PDF to a project. Validates ownership, size, mime type,
 * and per-project document count cap. Stores at
 * `${user_id}/${project_id}/${doc_id}.pdf` so the storage RLS policy
 * (path-prefix on user_id) gives us privacy.
 */
export async function uploadProjectDocument(
  formData: FormData,
): Promise<UploadDocumentResult> {
  const projectId = ((formData.get("project_id") as string) ?? "").trim();
  const file = formData.get("file");

  if (!projectId) return { error: "Missing project id" };
  if (!(file instanceof File)) return { error: "Pick a PDF to upload" };
  if (file.size === 0) return { error: "That file is empty" };
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return { error: `File must be ${MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024} MB or smaller` };
  }
  if (file.type !== ALLOWED_MIME) {
    return { error: "Only PDF files are supported right now" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Ownership check.
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.user_id !== user.id) {
    return { error: "Project not found" };
  }

  // Per-project cap to bound storage cost.
  const { count } = await supabase
    .from("project_documents")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if ((count ?? 0) >= MAX_DOCUMENTS_PER_PROJECT) {
    return {
      error: `This project already has ${MAX_DOCUMENTS_PER_PROJECT} docs. Delete one to add another.`,
    };
  }

  const docId = randomUUID();
  const storagePath = `${user.id}/${projectId}/${docId}.pdf`;
  const safeName = file.name.slice(0, 200);

  // Stream the upload to Storage.
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, {
      contentType: ALLOWED_MIME,
      upsert: false,
    });

  if (uploadErr) {
    console.error("[documents] storage upload failed:", uploadErr);
    return { error: "Could not upload — try again." };
  }

  const { data: row, error: insertErr } = await supabase
    .from("project_documents")
    .insert({
      id: docId,
      user_id: user.id,
      project_id: projectId,
      filename: safeName,
      storage_path: storagePath,
      size_bytes: file.size,
      // page_count is null at v1 — we don't pre-parse the PDF; Anthropic
      // counts pages on its side at Q&A time.
      page_count: null,
    })
    .select("id, filename")
    .single();

  if (insertErr || !row) {
    // Roll back the storage upload on DB failure so we don't orphan
    // a file the row layer can't see.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { error: "Could not save document — try again." };
  }

  revalidatePath(`/projects/${projectId}`);
  return { documentId: row.id, filename: row.filename };
}

/**
 * Delete a project document. Removes the Storage object first, then
 * the DB row. RLS guards on both. Idempotent — calling twice on the
 * same id just no-ops the second time.
 */
export async function deleteProjectDocument(formData: FormData) {
  const documentId = ((formData.get("id") as string) ?? "").trim();
  const projectId = ((formData.get("project_id") as string) ?? "").trim();
  if (!documentId || !projectId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: row } = await supabase
    .from("project_documents")
    .select("id, storage_path, user_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!row || row.user_id !== user.id) return;

  if (row.storage_path) {
    await supabase.storage.from(BUCKET).remove([row.storage_path]);
  }
  await supabase
    .from("project_documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", user.id);

  revalidatePath(`/projects/${projectId}`);
}
