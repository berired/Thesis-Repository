import type { KnowledgeChunk } from "./retrieve";

/**
 * The prompt, the shape of the model's answer, and the checks that decide whether its tips are
 * allowed through. The model is never trusted: every tip must cite a passage we gave it, must
 * share wording with that passage, and must not state doses or make diagnoses or predictions.
 */

export const MIN_TIPS = 2;
export const MAX_TIPS = 6;
const MAX_TIP_LENGTH = 260;

export const TIPS_SCHEMA = {
  type: "object",
  properties: {
    tips: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          sources: { type: "array", items: { type: "string" } },
        },
        required: ["text", "sources"],
      },
    },
  },
  required: ["tips"],
};

export const SYSTEM_PROMPT = `You write short care tips for a pet owner about ONE medicine or vaccine.
Use ONLY the numbered source passages you are given. Rules:
- Write 3 to 6 tips. Each is one plain, friendly sentence of at most 200 characters, addressed to the owner. Call the animal "your pet".
- Each tip lists the ids of the passages it is based on, for example ["S1"]. Use only ids that exist.
- Never state a dose, an amount, or a number of tablets. Never tell the owner to change, skip, double or stop a dose on their own.
- Never diagnose, never say what the pet has, and never predict how the pet will do or recover.
- Never add anything that is not in the passages. If the passages do not cover something, leave it out.
- When a passage lists warning signs, tell the owner to contact their vet if they see them.
Reply with JSON only.`;

/** The prompt carries no names or ids: only the medicine, the species and the age. */
export function buildUserPrompt(args: {
  title: string;
  kind: string;
  species: string;
  age: string;
  chunks: KnowledgeChunk[];
}) {
  const passages = args.chunks.map((c, i) => `[S${i + 1}] ${c.content}`).join("\n\n");
  return `Record: ${args.title} (${args.kind})
Animal: ${args.species}, ${args.age}

Source passages:
${passages}

Write the owner tips.`;
}

export function passageIds(chunks: KnowledgeChunk[]) {
  return chunks.map((_, i) => `S${i + 1}`);
}

// ---------------------------------------------------------------------------------------------
// Output checks

/** Amounts: "250 mg", "2 tablets", "5 ml". */
const AMOUNT = /\b\d+([.,]\d+)?\s?(mg|mcg|µg|ml|mL|g|iu|units?|tablets?|tabs?|capsules?|drops?|pills?)\b/i;
/** Telling the owner to alter a dose. A sentence that also says "do not" / "never" is allowed. */
const DOSE_CHANGE = /\b(double|increase|raise|extra|skip|reduce|halve|lower)\b[^.!?]{0,30}\b(dose|dosage|amount|tablets?|capsules?)\b/i;
const NEGATION = /\b(do not|don't|dont|never|not)\b/i;
/** Diagnosis and prognosis wording. */
const DIAGNOSIS = /\b(diagnos\w*|prognosis|will (recover|get better|heal|improve|die|be fine|be cured)|should (recover|get better|improve)|expect(ed)? to (recover|improve)|cure[sd]?|your pet (is suffering from|probably has|likely has|must have|seems to have))\b/i;

export function violatesSafety(text: string): string | null {
  if (AMOUNT.test(text)) return "states an amount";
  if (DIAGNOSIS.test(text)) return "diagnosis or prognosis wording";
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (DOSE_CHANGE.test(sentence) && !NEGATION.test(sentence)) return "changes a dose";
  }
  return null;
}

const STOP = new Set(["about", "should", "please", "their", "there", "these", "those", "which", "while", "would", "could", "other", "after", "before", "every", "again"]);
function words(s: string) {
  return new Set(
    (s.toLowerCase().match(/[a-z]{5,}/g) ?? []).filter((w) => !STOP.has(w)),
  );
}

export type CheckedTip = { text: string; sources: string[] };
export type CheckResult = {
  tips: CheckedTip[];
  /** Tips the model wrote that were dropped, with the reason (for the evaluation). */
  dropped: { text: string; reason: string }[];
};

/** Keeps only the tips that are well formed, cited, grounded and safe. */
export function checkTips(raw: unknown, chunks: KnowledgeChunk[]): CheckResult {
  const ids = passageIds(chunks);
  const out: CheckResult = { tips: [], dropped: [] };
  const list = (raw as { tips?: unknown } | null)?.tips;
  if (!Array.isArray(list)) return out;

  const seen = new Set<string>();
  for (const item of list) {
    const text = typeof (item as { text?: unknown })?.text === "string" ? (item as { text: string }).text.trim() : "";
    if (!text) continue;
    const cited = Array.isArray((item as { sources?: unknown }).sources)
      ? [...new Set(((item as { sources: unknown[] }).sources).filter((s): s is string => typeof s === "string" && ids.includes(s)))]
      : [];
    const drop = (reason: string) => out.dropped.push({ text, reason });

    if (text.length > MAX_TIP_LENGTH) { drop("too long"); continue; }
    if (cited.length === 0) { drop("cites no known passage"); continue; }
    const bad = violatesSafety(text);
    if (bad) { drop(bad); continue; }

    const own = words(text);
    const source = new Set<string>();
    for (const id of cited) for (const w of words(chunks[ids.indexOf(id)].content)) source.add(w);
    let shared = 0;
    for (const w of own) if (source.has(w)) shared++;
    if (shared < 2) { drop("not grounded in the cited passage"); continue; }

    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.tips.push({ text, sources: cited });
    if (out.tips.length === MAX_TIPS) break;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Allergy note (a plain string match on our side, never the model's call)

/** Drug classes people write in an allergy field, per entry. */
const CLASS_TERMS: Record<string, string[]> = {
  amoxicillin: ["penicillin", "beta-lactam", "beta lactam"],
  "amoxicillin-clavulanate": ["penicillin", "cephalosporin", "beta-lactam", "beta lactam"],
  cephalexin: ["cephalosporin", "penicillin", "beta-lactam", "beta lactam"],
  clindamycin: ["lincomycin", "lincosamide"],
  enrofloxacin: ["quinolone", "fluoroquinolone", "floxacin"],
  carprofen: ["nsaid", "aspirin", "anti-inflammatory", "anti inflammatory"],
  meloxicam: ["nsaid", "aspirin", "anti-inflammatory", "anti inflammatory"],
  grapiprant: ["nsaid", "aspirin", "anti-inflammatory", "anti inflammatory"],
  "ivermectin-pyrantel": ["ivermectin", "pyrantel"],
  selamectin: ["selamectin"],
  afoxolaner: ["isoxazoline", "nexgard"],
};

export function allergyMatches(
  allergies: string | null,
  entry: { entryKey: string; name: string; aliases: string[] },
): boolean {
  const text = (allergies ?? "").toLowerCase();
  if (!text.trim()) return false;
  const terms = [entry.name, ...entry.aliases, ...(CLASS_TERMS[entry.entryKey] ?? [])]
    .map((t) => t.toLowerCase())
    .filter((t) => t.length >= 4);
  return terms.some((t) => text.includes(t));
}
