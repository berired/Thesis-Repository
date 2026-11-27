// Loads the curated knowledge base (knowledge/*.md) into the knowledge_chunk table, with an
// embedding per chunk. Safe to run again: chunks whose text and metadata are unchanged are
// skipped (no embedding call), changed ones are updated, and chunks of removed files are deleted.
//
//   node scripts/ingest-knowledge.mjs            # uses DATABASE_URL from .env (the stage branch)
//   node scripts/ingest-knowledge.mjs --dry      # parse and report only, no database or AI calls
//   DATABASE_URL=<production url> node scripts/ingest-knowledge.mjs
//
// Needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (Workers AI) in .env.
import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const DRY = process.argv.includes("--dry");
const DIR = "knowledge";
const EMBED_MODEL = "@cf/baai/bge-base-en-v1.5";
const MAX_CHARS = 1800; // about 450 tokens; the model reads at most 512

// ---- parse -------------------------------------------------------------------------------
function parseFile(file) {
  const raw = readFileSync(join(DIR, file), "utf8").replace(/\r\n/g, "\n");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const val = line.slice(i + 1).trim();
    meta[key] = val.startsWith("[") || val.startsWith('"') ? JSON.parse(val) : val;
  }
  for (const k of ["key", "name", "kind", "aliases", "species", "source", "source_url", "source_version"]) {
    if (meta[k] === undefined) throw new Error(`${file}: frontmatter is missing "${k}"`);
  }
  if (meta.key !== file.replace(/\.md$/, "")) throw new Error(`${file}: key must match the file name`);

  // Body: "# Title", an intro, then "## Section" blocks.
  const body = m[2].replace(/^# .*\n+/, "");
  const parts = body.split(/\n(?=## )/);
  const sections = parts
    .map((p, i) => {
      const t = p.trim();
      if (!t) return null;
      const h = t.match(/^## (.*)\n/);
      return { heading: h ? h[1].trim() : "Overview", text: (h ? t.slice(h[0].length) : t).trim(), intro: i === 0 && !h };
    })
    .filter(Boolean);

  const sources = [meta.source];
  const chunks = sections.map((s, i) => {
    const aka = i === 0 && meta.aliases.length ? ` Also known as: ${meta.aliases.join(", ")}.` : "";
    const content = `${meta.name} (${meta.kind} for ${meta.species.join(" and ")}), ${s.heading.toLowerCase()}.${aka}\n${s.text}`;
    if (content.length > MAX_CHARS) throw new Error(`${file}: section "${s.heading}" is too long (${content.length} chars)`);
    const contentHash = createHash("sha256")
      .update(JSON.stringify([content, meta.source, meta.source_url, meta.source_version, meta.species, meta.aliases, meta.reviewed]))
      .digest("hex");
    return { entryKey: meta.key, chunkIndex: i, content, contentHash };
  });
  return {
    meta: {
      name: meta.name,
      kind: meta.kind,
      species: meta.species,
      aliases: meta.aliases,
      sourceName: sources.join("; "),
      sourceUrl: meta.source_url,
      sourceVersion: meta.source_version,
      reviewed: meta.reviewed === "true",
    },
    chunks,
  };
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".md") && f !== "README.md").sort();
const entries = files.map((f) => ({ file: f, ...parseFile(f) }));
const total = entries.reduce((n, e) => n + e.chunks.length, 0);
console.log(`${entries.length} entries, ${total} chunks`);
if (DRY) {
  for (const e of entries) console.log(`  ${e.file}: ${e.chunks.length} chunks, ${e.chunks.map((c) => c.content.length).join("/")} chars`);
  process.exit(0);
}

// ---- embed + store -------------------------------------------------------------------------
const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!account || !token) throw new Error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL must be set");

async function embed(texts) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${EMBED_MODEL}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ text: texts }),
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(`embedding failed: ${json?.errors?.[0]?.message ?? res.status}`);
  return json.result.data;
}

const sql = neon(process.env.DATABASE_URL);
const existing = await sql`select "entryKey", "chunkIndex", "contentHash", embedding is not null as has_vec from knowledge_chunk`;
const have = new Map(existing.map((r) => [`${r.entryKey}:${r.chunkIndex}`, r]));

let embedded = 0;
let skipped = 0;
for (const e of entries) {
  const todo = e.chunks.filter((c) => {
    const row = have.get(`${c.entryKey}:${c.chunkIndex}`);
    return !(row && row.contentHash === c.contentHash && row.has_vec);
  });
  skipped += e.chunks.length - todo.length;
  if (todo.length > 0) {
    const vectors = await embed(todo.map((c) => c.content));
    for (let i = 0; i < todo.length; i++) {
      const c = todo[i];
      const lit = `[${vectors[i].join(",")}]`;
      await sql`
        insert into knowledge_chunk (id, "entryKey", "chunkIndex", name, kind, species, aliases, content,
          "sourceName", "sourceUrl", "sourceVersion", reviewed, "contentHash", embedding, "updatedAt")
        values (${randomUUID()}, ${c.entryKey}, ${c.chunkIndex}, ${e.meta.name}, ${e.meta.kind}, ${e.meta.species},
          ${e.meta.aliases}, ${c.content}, ${e.meta.sourceName}, ${e.meta.sourceUrl}, ${e.meta.sourceVersion},
          ${e.meta.reviewed}, ${c.contentHash}, ${lit}::vector, now())
        on conflict ("entryKey", "chunkIndex") do update set
          name = excluded.name, kind = excluded.kind, species = excluded.species, aliases = excluded.aliases,
          content = excluded.content, "sourceName" = excluded."sourceName", "sourceUrl" = excluded."sourceUrl",
          "sourceVersion" = excluded."sourceVersion", reviewed = excluded.reviewed,
          "contentHash" = excluded."contentHash", embedding = excluded.embedding, "updatedAt" = now()`;
      embedded++;
    }
  }
  // Sections removed from a file leave stale rows behind.
  await sql`delete from knowledge_chunk where "entryKey" = ${e.chunks[0].entryKey} and "chunkIndex" >= ${e.chunks.length}`;
}

// Entries whose files are gone.
const keys = entries.map((e) => e.chunks[0].entryKey);
const removed = await sql`delete from knowledge_chunk where not ("entryKey" = any(${keys})) returning "entryKey"`;
console.log(`embedded ${embedded}, unchanged ${skipped}, removed ${removed.length}`);
