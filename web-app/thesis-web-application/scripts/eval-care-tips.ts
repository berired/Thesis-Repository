// Evaluation of the care-tips pipeline (Phase 11), for the thesis write-up.
//
//   Part A  Retrieval: does a record title find the right knowledge entry, and does it correctly
//           find nothing for medicines and vaccines we have no entry for, or the wrong species?
//   Part B  Distance cutoff: the vector-match distance for every case, so the cutoff
//           (MAX_DISTANCE in app/lib/care-tips/retrieve.ts) can be chosen from data.
//   Part C  Generation: for each known case, how many tips the model wrote, how many passed the
//           checks (cited, grounded in the passage, no amounts, no diagnosis or prognosis), and why
//           the others were dropped.
//
// Runs against the database in DATABASE_URL (stage) and spends a few Workers AI Neurons.
//
//   npx -y esbuild scripts/eval-care-tips.ts --bundle --platform=node --format=esm \
//     --packages=external --outfile=node_modules/.cache/eval-care-tips.mjs
//   node node_modules/.cache/eval-care-tips.mjs [--generate]
//
// Without --generate only parts A and B run (embedding calls only).
import "dotenv/config";
import { retrieve, MAX_DISTANCE, knowledgeSpecies, type RecordKind } from "../app/lib/care-tips/retrieve";
import { writeTips } from "../app/lib/care-tips/run";

type Case = { title: string; kind: RecordKind; species: string; expect: string | null; anyOf?: string[]; note?: string };

const KNOWN: Case[] = [
  // Exact names and brand names (the name match)
  { title: "Amoxicillin 250 mg", kind: "medication", species: "Dog", expect: "amoxicillin" },
  { title: "Amoxi-Tabs", kind: "medication", species: "Cat", expect: "amoxicillin" },
  { title: "Clavamox chewable", kind: "medication", species: "Cat", expect: "amoxicillin-clavulanate" },
  { title: "Amoxicillin-clavulanate", kind: "medication", species: "Dog", expect: "amoxicillin-clavulanate" },
  { title: "Cephalexin 500mg", kind: "medication", species: "Dog", expect: "cephalexin" },
  { title: "Keflex", kind: "medication", species: "Dog", expect: "cephalexin" },
  { title: "Clindamycin", kind: "medication", species: "Dog", expect: "clindamycin" },
  { title: "Antirobe", kind: "medication", species: "Cat", expect: "clindamycin" },
  { title: "Baytril", kind: "medication", species: "Cat", expect: "enrofloxacin" },
  { title: "Rimadyl", kind: "medication", species: "Dog", expect: "carprofen" },
  { title: "Carprofen (pain relief)", kind: "medication", species: "Dog", expect: "carprofen" },
  { title: "Metacam", kind: "medication", species: "Dog", expect: "meloxicam" },
  { title: "Galliprant", kind: "medication", species: "Dog", expect: "grapiprant" },
  { title: "Panacur dewormer", kind: "medication", species: "Dog", expect: "fenbendazole" },
  { title: "Heartgard Plus", kind: "medication", species: "Dog", expect: "ivermectin-pyrantel" },
  { title: "Heartworm preventive", kind: "medication", species: "Dog", expect: "ivermectin-pyrantel" },
  { title: "NexGard", kind: "medication", species: "Dog", expect: "afoxolaner" },
  { title: "Flea and tick preventive", kind: "medication", species: "Dog", expect: "afoxolaner" },
  { title: "Revolution", kind: "medication", species: "Cat", expect: "selamectin" },
  { title: "Rabies vaccine", kind: "vaccination", species: "Dog", expect: "rabies-vaccine" },
  { title: "Anti-rabies", kind: "vaccination", species: "Cat", expect: "rabies-vaccine" },
  { title: "DHPP", kind: "vaccination", species: "Dog", expect: "dhpp-dog-core-vaccine" },
  { title: "5-in-1 puppy vaccine", kind: "vaccination", species: "Dog", expect: "dhpp-dog-core-vaccine" },
  { title: "Parvo vaccine", kind: "vaccination", species: "Dog", expect: "dhpp-dog-core-vaccine" },
  { title: "FVRCP", kind: "vaccination", species: "Cat", expect: "fvrcp-cat-core-vaccine" },
  { title: "Feline distemper vaccine", kind: "vaccination", species: "Cat", expect: "fvrcp-cat-core-vaccine" },
  // Misspellings (the name match fails, so the vector search must find them)
  { title: "Amoxicilin", kind: "medication", species: "Dog", expect: "amoxicillin", note: "misspelled" },
  { title: "Carprophen", kind: "medication", species: "Dog", expect: "carprofen", note: "misspelled" },
  { title: "Meloxicm", kind: "medication", species: "Dog", expect: "meloxicam", note: "misspelled" },
  { title: "Clindamycn", kind: "medication", species: "Dog", expect: "clindamycin", note: "misspelled" },
  { title: "Enrofloxacine", kind: "medication", species: "Dog", expect: "enrofloxacin", note: "misspelled" },
  { title: "Fenbendazol", kind: "medication", species: "Dog", expect: "fenbendazole", note: "misspelled" },
  { title: "Rabbies vaccin", kind: "vaccination", species: "Dog", expect: "rabies-vaccine", note: "misspelled" },
];

// Titles that describe the medicine instead of naming it. Only the meaning can match these.
const DESCRIPTIVE: Case[] = [
  { title: "Monthly heartworm pill", kind: "medication", species: "Dog", expect: "ivermectin-pyrantel", note: "descriptive" },
  { title: "Deworming tablets", kind: "medication", species: "Dog", expect: "fenbendazole", note: "descriptive" },
  { title: "Tick and flea chew", kind: "medication", species: "Dog", expect: "afoxolaner", note: "descriptive" },
  { title: "Arthritis pain medicine", kind: "medication", species: "Dog", expect: null, anyOf: ["carprofen", "meloxicam", "grapiprant"], note: "descriptive" },
  { title: "Antibiotic for skin infection", kind: "medication", species: "Dog", expect: null, anyOf: ["amoxicillin", "amoxicillin-clavulanate", "cephalexin", "clindamycin", "enrofloxacin"], note: "descriptive" },
  { title: "Anti-inflammatory", kind: "medication", species: "Dog", expect: null, anyOf: ["carprofen", "meloxicam", "grapiprant"], note: "descriptive" },
];

// Nothing in the knowledge base covers these, so the right answer is "no entry".
const UNKNOWN: Case[] = [
  { title: "Prednisolone", kind: "medication", species: "Dog", expect: null },
  { title: "Metronidazole", kind: "medication", species: "Dog", expect: null },
  { title: "Doxycycline", kind: "medication", species: "Cat", expect: null },
  { title: "Gabapentin", kind: "medication", species: "Cat", expect: null },
  { title: "Cerenia", kind: "medication", species: "Dog", expect: null },
  { title: "Apoquel", kind: "medication", species: "Dog", expect: null },
  { title: "Insulin", kind: "medication", species: "Dog", expect: null },
  { title: "Furosemide", kind: "medication", species: "Dog", expect: null },
  { title: "Phenobarbital", kind: "medication", species: "Dog", expect: null },
  { title: "Probiotic supplement", kind: "medication", species: "Cat", expect: null },
  { title: "Bordetella vaccine", kind: "vaccination", species: "Dog", expect: null },
  { title: "Leptospirosis vaccine", kind: "vaccination", species: "Dog", expect: null },
  { title: "FeLV vaccine", kind: "vaccination", species: "Cat", expect: null },
  { title: "Canine influenza vaccine", kind: "vaccination", species: "Dog", expect: null },
];

// Right drug, wrong species: entries list the species they apply to.
const WRONG_SPECIES: Case[] = [
  { title: "Carprofen", kind: "medication", species: "Cat", expect: null, note: "dogs only" },
  { title: "Metacam", kind: "medication", species: "Cat", expect: null, note: "dogs only (fatal in cats)" },
  { title: "NexGard", kind: "medication", species: "Cat", expect: null, note: "dogs only" },
  { title: "Heartgard Plus", kind: "medication", species: "Cat", expect: null, note: "dogs only" },
  { title: "DHPP", kind: "vaccination", species: "Cat", expect: null, note: "dog vaccine" },
  { title: "FVRCP", kind: "vaccination", species: "Dog", expect: null, note: "cat vaccine" },
];

const pct = (n: number, d: number) => (d === 0 ? "n/a" : `${((100 * n) / d).toFixed(0)}% (${n}/${d})`);
const wantGenerate = process.argv.includes("--generate");

type Row = { c: Case; got: string | null; method: string | null; distance: number | null };

async function lookup(c: Case): Promise<Row> {
  const species = knowledgeSpecies(c.species);
  if (!species) return { c, got: null, method: null, distance: null };
  // maxDistance 1 returns the nearest entry whatever its distance, so every distance is recorded.
  const r = await retrieve({ title: c.title, kind: c.kind, species, maxDistance: 1 });
  return { c, got: r?.entryKey ?? null, method: r?.method ?? null, distance: r?.distance ?? null };
}

/** What the real pipeline (with the real cutoff) would return for this row. */
const withCutoff = (r: Row, cutoff: number) =>
  r.method === "vector" && (r.distance ?? 1) > cutoff ? null : r.got;

async function main() {
  const known: Row[] = [];
  const unknown: Row[] = [];
  const wrong: Row[] = [];
  const desc: Row[] = [];
  for (const c of KNOWN) known.push(await lookup(c));
  for (const c of UNKNOWN) unknown.push(await lookup(c));
  for (const c of WRONG_SPECIES) wrong.push(await lookup(c));
  for (const c of DESCRIPTIVE) desc.push(await lookup(c));

  // ---- Part A
  console.log(`\n=== Part A: retrieval with the cutoff in use (${MAX_DISTANCE}) ===`);
  const exact = known.filter((r) => !r.c.note);
  const typo = known.filter((r) => r.c.note === "misspelled");
  const ok = (r: Row) => withCutoff(r, MAX_DISTANCE) === r.c.expect;
  const okDesc = (r: Row, cutoff = MAX_DISTANCE) => {
    const got = withCutoff(r, cutoff);
    return r.c.anyOf ? got !== null && r.c.anyOf.includes(got) : got === r.c.expect;
  };
  const how = (rows: Row[]) =>
    ["name", "fuzzy", "vector"]
      .map((m) => m + " " + rows.filter((r) => r.method === m && withCutoff(r, MAX_DISTANCE) !== null).length)
      .join(", ");
  console.log("known drug or vaccine, exact or brand name:", pct(exact.filter(ok).length, exact.length));
  console.log("known drug or vaccine, misspelled:         ", pct(typo.filter(ok).length, typo.length));
  console.log("described, not named (semantic only):         ", pct(desc.filter((r) => okDesc(r)).length, desc.length));
  console.log("how the known ones were found:", how(known));
  console.log("no entry exists (should return nothing):   ", pct(unknown.filter((r) => withCutoff(r, MAX_DISTANCE) === null).length, unknown.length));
  console.log("wrong species (should return nothing):     ", pct(wrong.filter((r) => withCutoff(r, MAX_DISTANCE) === null).length, wrong.length));
  console.log("\nMisses and false matches:");
  for (const r of [...known, ...unknown, ...wrong, ...desc]) {
    const got = withCutoff(r, MAX_DISTANCE);
    if (!(r.c.anyOf ? okDesc(r) : got === r.c.expect)) {
      console.log(`  "${r.c.title}" (${r.c.species}) expected ${r.c.expect ?? "nothing"}, got ${got ?? "nothing"} [${r.method ?? "-"}${r.distance !== null ? " d=" + r.distance.toFixed(3) : ""}]`);
    }
  }

  // ---- Part B
  console.log("\n=== Part B: vector distances (smaller is closer) ===");
  const vec = (rows: Row[]) => rows.filter((r) => r.method === "vector").map((r) => r.distance as number).sort((a, b) => a - b);
  const fmt = (xs: number[]) => (xs.length ? `${xs.map((x) => x.toFixed(3)).join(" ")}` : "(none)");
  console.log("misspelled known (should match):  ", fmt(vec(typo)));
  console.log("described, not named (should match): ", fmt(vec(desc)));
  console.log("no entry exists (should not match):", fmt(vec(unknown)));
  console.log("\nCutoff sweep (correct on described-not-named / correct on no-entry):");
  for (const cutoff of [0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5]) {
    const a = desc.filter((r) => okDesc(r, cutoff)).length;
    const b = unknown.filter((r) => withCutoff(r, cutoff) === null).length;
    console.log(`  ${cutoff.toFixed(2)}  described ${a}/${desc.length}   no-entry ${b}/${unknown.length}`);
  }

  // ---- Part C
  if (!wantGenerate) {
    console.log("\n(Run with --generate to also test the tip writing.)");
    return;
  }
  console.log("\n=== Part C: generation and checks ===");
  const sample = exact.filter((r) => r.got);
  let written = 0;
  let accepted = 0;
  let zero = 0;
  const reasons = new Map<string, number>();
  const examples: string[] = [];
  for (const r of sample) {
    const species = knowledgeSpecies(r.c.species)!;
    const found = await retrieve({ title: r.c.title, kind: r.c.kind, species });
    if (!found) continue;
    const out = await writeTips({ title: r.c.title, kind: r.c.kind, species, age: "3 years", chunks: found.chunks });
    written += out.tips.length + out.dropped.length;
    accepted += out.tips.length;
    if (out.tips.length < 2) zero++;
    for (const d of out.dropped) reasons.set(d.reason, (reasons.get(d.reason) ?? 0) + 1);
    if (examples.length < 3) examples.push(`${r.c.title} (${r.c.species}):\n` + out.tips.map((t) => `   - ${t.text}  [${t.sources.join(",")}]`).join("\n"));
  }
  console.log("records tested:", sample.length);
  console.log("tips written by the model:", written);
  console.log("tips that passed every check:", pct(accepted, written));
  console.log("records left with fewer than 2 tips (would be FAILED):", pct(zero, sample.length));
  console.log("why tips were dropped:", reasons.size ? [...reasons].map(([k, v]) => `${k} x${v}`).join("; ") : "none");
  console.log("\nExamples:\n" + examples.join("\n"));
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
