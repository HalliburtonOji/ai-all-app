export interface JobAudit {
  id: string;
  user_id: string;
  job_title: string;
  responsibilities: string | null;
  top_tasks: string | null;
  worries: string | null;
  hopes: string | null;
  summary: string | null;
  model: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * One profession pack — curated, version-controlled markdown that
 * lives at content/profession-packs/<slug>.md. Frontmatter drives
 * the catalog card; the markdown body is the read-the-pack content.
 */
export interface ProfessionPackMeta {
  slug: string;
  title: string;
  /** One-sentence subtitle for catalog cards. */
  summary: string;
  /** Used to sort the catalog (e.g. "Designer", "Writer", …). */
  order: number;
}

export interface ProfessionPack extends ProfessionPackMeta {
  body: string;
}
