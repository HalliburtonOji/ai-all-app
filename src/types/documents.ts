export interface ProjectDocument {
  id: string;
  user_id: string;
  project_id: string;
  filename: string;
  storage_path: string;
  size_bytes: number;
  page_count: number | null;
  created_at: string;
  /**
   * 1-hour signed URL — hydrated server-side at page-load. Null if
   * generation failed (rare — Storage outage). Used only by the
   * "Open original" link; the Q&A flow re-fetches the file fresh
   * each time so cached signed URLs don't matter.
   */
  signed_url?: string | null;
}

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MiB
export const MAX_DOCUMENTS_PER_PROJECT = 10;
