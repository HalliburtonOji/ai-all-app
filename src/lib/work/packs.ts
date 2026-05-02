import "server-only";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { ProfessionPack, ProfessionPackMeta } from "@/types/work";

/**
 * Profession packs live as version-controlled markdown in
 * content/profession-packs/<slug>.md. Same shape as the lessons
 * registry — frontmatter parsed by hand (small fixed schema, no
 * gray-matter dep), cached per Node process.
 */

const PACKS_DIR = path.join(process.cwd(), "content", "profession-packs");

let cache: ProfessionPack[] | null = null;

function parseFrontmatter(raw: string): {
  meta: ProfessionPackMeta;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Profession pack file missing frontmatter block");
  }
  const [, frontmatter, body] = match;

  const fields: Record<string, string> = {};
  for (const line of frontmatter.split(/\r?\n/)) {
    const m = line.match(/^([a-z_]+):\s*(.+)$/);
    if (!m) continue;
    fields[m[1]] = m[2].trim();
  }

  const required = ["slug", "title", "summary", "order"];
  for (const k of required) {
    if (!fields[k]) {
      throw new Error(`Profession pack frontmatter missing field: ${k}`);
    }
  }

  return {
    meta: {
      slug: fields.slug,
      title: fields.title,
      summary: fields.summary,
      order: Number.parseInt(fields.order, 10),
    },
    body: body.trim(),
  };
}

function loadAll(): ProfessionPack[] {
  if (cache) return cache;

  const files = readdirSync(PACKS_DIR).filter((f) => f.endsWith(".md"));
  const packs: ProfessionPack[] = files.map((file) => {
    const raw = readFileSync(path.join(PACKS_DIR, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    return { ...meta, body };
  });

  packs.sort((a, b) => a.order - b.order);
  cache = packs;
  return packs;
}

export function getAllProfessionPacks(): ProfessionPack[] {
  return loadAll();
}

export function getProfessionPackBySlug(
  slug: string,
): ProfessionPack | null {
  return loadAll().find((p) => p.slug === slug) ?? null;
}
