import { prisma } from "../prisma";
import { embed, toVectorLiteral } from "./ai";

/**
 * Finds the curated knowledge entry for a record, in three steps, most trusted first:
 *   1. name: the drug, brand or alias appears in the title as a whole word;
 *   2. fuzzy: a word in the title is one or two typos away from a drug name or alias;
 *   3. vector: the closest entry by meaning, medicines only, and only if very close.
 * Measured with scripts/eval-care-tips.ts: a bare drug name gives an embedding too little to work
 * with (unknown drugs land about as close as typos of known ones), so the vector step is a last
 * resort with a tight cutoff, and is never used for vaccines, where a wrong match would mislead.
 * No entry means no tips (see run.ts).
 */

/** Cosine distance above which a vector match is not trusted. Chosen from the evaluation. */
export const MAX_DISTANCE = 0.2;

export type RecordKind = "medication" | "vaccination";

export type KnowledgeChunk = {
  entryKey: string;
  chunkIndex: number;
  name: string;
  kind: string;
  species: string[];
  aliases: string[];
  content: string;
  sourceName: string;
  sourceUrl: string;
  sourceVersion: string;
  reviewed: boolean;
};

export type Retrieved = {
  entryKey: string;
  name: string;
  aliases: string[];
  chunks: KnowledgeChunk[];
  /** How it was found, and (for vector matches) how far away it is. */
  method: "name" | "fuzzy" | "vector";
  distance: number | null;
};

/** Only dogs and cats are covered by the knowledge base. */
export function knowledgeSpecies(petSpecies: string): "dog" | "cat" | null {
  const s = petSpecies.trim().toLowerCase();
  return s === "dog" || s === "cat" ? s : null;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The longest drug or alias that appears in the title as a whole word, or 0. */
function longestTermMatch(title: string, terms: string[]) {
  let best = 0;
  for (const raw of terms) {
    const term = raw.trim().toLowerCase();
    if (term.length < 3 || term.length <= best) continue;
    if (new RegExp(`(^|[^a-z0-9])${escape(term)}($|[^a-z0-9])`, "i").test(title)) best = term.length;
  }
  return best;
}

/** Edit distance counting a swap of two neighbouring letters as one edit. */
function editDistance(a: string, b: string) {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** The smallest edit distance between a title word and a one-word drug name, if close enough to be a typo. */
function fuzzyScore(title: string, terms: string[]) {
  const words = (title.toLowerCase().match(/[a-z]{5,}/g) ?? []);
  let best = Infinity;
  for (const raw of terms) {
    const term = raw.trim().toLowerCase();
    if (!/^[a-z]{5,}$/.test(term)) continue;
    const allowed = term.length >= 9 ? 2 : 1;
    for (const w of words) {
      if (Math.abs(w.length - term.length) > allowed) continue;
      const dist = editDistance(w, term);
      if (dist <= allowed && dist < best) best = dist;
    }
  }
  return best;
}

const CHUNK_SELECT = {
  entryKey: true,
  chunkIndex: true,
  name: true,
  kind: true,
  species: true,
  aliases: true,
  content: true,
  sourceName: true,
  sourceUrl: true,
  sourceVersion: true,
  reviewed: true,
} as const;

async function entryChunks(entryKey: string): Promise<KnowledgeChunk[]> {
  return prisma.knowledgeChunk.findMany({
    where: { entryKey },
    orderBy: { chunkIndex: "asc" },
    select: CHUNK_SELECT,
  });
}

export async function retrieve(args: {
  title: string;
  kind: RecordKind;
  species: "dog" | "cat";
  /** Only the evaluation script changes this. */
  maxDistance?: number;
}): Promise<Retrieved | null> {
  const { title, kind, species, maxDistance = MAX_DISTANCE } = args;

  // 1. Name match against every entry's name and aliases.
  const heads = await prisma.knowledgeChunk.findMany({
    where: { chunkIndex: 0, kind, species: { has: species } },
    select: { entryKey: true, name: true, aliases: true },
  });
  let best: { entryKey: string; name: string; aliases: string[]; score: number } | null = null;
  for (const h of heads) {
    const score = longestTermMatch(title, [h.name, ...h.aliases]);
    if (score > 0 && (!best || score > best.score)) best = { ...h, score };
  }
  if (best) {
    const chunks = await entryChunks(best.entryKey);
    if (chunks.length > 0) {
      return { entryKey: best.entryKey, name: best.name, aliases: best.aliases, chunks, method: "name", distance: null };
    }
  }

  // 2. A typo of a name or alias.
  let close: { entryKey: string; name: string; aliases: string[]; score: number } | null = null;
  for (const h of heads) {
    const score = fuzzyScore(title, [h.name, ...h.aliases]);
    if (score < Infinity && (!close || score < close.score)) close = { ...h, score };
  }
  if (close) {
    const chunks = await entryChunks(close.entryKey);
    if (chunks.length > 0) {
      return { entryKey: close.entryKey, name: close.name, aliases: close.aliases, chunks, method: "fuzzy", distance: null };
    }
  }

  // 3. Closest by meaning, medicines only, only if very close.
  if (kind !== "medication") return null;
  const [vector] = await embed([`${title} (${kind} for a ${species})`]);
  const literal = toVectorLiteral(vector);
  const rows = await prisma.$queryRaw<{ entryKey: string; name: string; aliases: string[]; distance: number }[]>`
    SELECT "entryKey", name, aliases, (embedding <=> ${literal}::vector) AS distance
    FROM knowledge_chunk
    WHERE embedding IS NOT NULL AND kind = ${kind} AND ${species} = ANY(species)
    ORDER BY embedding <=> ${literal}::vector
    LIMIT 1`;
  const top = rows[0];
  if (!top || Number(top.distance) > maxDistance) return null;
  const chunks = await entryChunks(top.entryKey);
  if (chunks.length === 0) return null;
  return {
    entryKey: top.entryKey,
    name: top.name,
    aliases: top.aliases,
    chunks,
    method: "vector",
    distance: Number(top.distance),
  };
}
