export interface PathMateSignal {
  user_id: string;
  path: string;
  bio: string | null;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/** Constraints kept in sync with the path_mate_signals migration. */
export const MAX_PATH_LENGTH = 100;
export const MAX_BIO_LENGTH = 500;
export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 30;

/**
 * Compute how many tags two signals share. Used to sort the discovery
 * list by relevance to the viewer's own tags.
 */
export function tagOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const set = new Set(a.map((t) => t.toLowerCase()));
  let n = 0;
  for (const t of b) {
    if (set.has(t.toLowerCase())) n++;
  }
  return n;
}
