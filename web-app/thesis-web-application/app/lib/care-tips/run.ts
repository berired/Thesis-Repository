import { prisma } from "../prisma";
import { notify } from "../notifications";
import { accessiblePets } from "../pet-access";
import { formatAge } from "../pets";
import { rateLimit } from "../rate-limit";
import { GENERATE_MODEL, generateJson } from "./ai";
import { SYSTEM_PROMPT, TIPS_SCHEMA, MIN_TIPS, allergyMatches, buildUserPrompt, checkTips } from "./prompt";
import { knowledgeSpecies, retrieve, type KnowledgeChunk } from "./retrieve";
import type { CareTipStatus } from "../../generated/prisma/client";

/**
 * The event-triggered flow: a vet saved a medication or vaccination record, so write owner
 * tips from the curated knowledge base. Safe to call more than once for a record, and it never
 * throws: whatever happens, the record already exists and the outcome is stored on the CareTip.
 *
 * Reminders for each dose are not made here; they come from the record's own dose reminders.
 */

const STALE_SECONDS = 60;

function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

async function finish(
  recordId: string,
  status: CareTipStatus,
  data: Partial<{ detail: string; tips: object; sources: object; allergyNote: string | null; model: string }> = {},
) {
  await prisma.careTip.update({
    where: { recordId },
    data: { status, generatedAt: status === "READY" ? new Date() : null, ...data },
  });
  return status;
}

/** Asks the model for tips from the given passages and keeps only the ones that pass the checks. */
export async function writeTips(args: {
  title: string;
  kind: string;
  species: string;
  age: string;
  chunks: KnowledgeChunk[];
}) {
  const raw = await generateJson(SYSTEM_PROMPT, buildUserPrompt(args), TIPS_SCHEMA);
  return checkTips(raw, args.chunks);
}

export async function generateCareTips(recordId: string): Promise<CareTipStatus | "skipped"> {
  try {
    const record = await prisma.healthRecord.findUnique({
      where: { id: recordId },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            birthDate: true,
            birthDateApproximate: true,
            allergies: true,
            ownerId: true,
          },
        },
      },
    });
    if (
      !record ||
      record.source !== "VET" ||
      record.voidedAt ||
      (record.type !== "MEDICATION" && record.type !== "VACCINATION")
    ) {
      return "skipped";
    }

    // Claim the work: the first caller creates the row; a later caller may only take over a
    // row that has sat PENDING for a minute (a crashed job).
    try {
      await prisma.careTip.create({ data: { recordId, status: "PENDING" } });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      const took = await prisma.careTip.updateMany({
        where: { recordId, status: "PENDING", updatedAt: { lt: new Date(Date.now() - STALE_SECONDS * 1000) } },
        data: { updatedAt: new Date() },
      });
      if (took.count !== 1) return "skipped";
    }

    const { pet } = record;
    if (!(await rateLimit("care-tips", pet.id, 10, 3600))) {
      return finish(recordId, "FAILED", { detail: "Rate limited." });
    }

    const species = knowledgeSpecies(pet.species);
    if (!species) {
      return finish(recordId, "NO_SOURCE", { detail: `No knowledge for species "${pet.species}".` });
    }
    const kind = record.type === "MEDICATION" ? "medication" : "vaccination";

    const found = await retrieve({ title: record.title, kind, species });
    if (!found) return finish(recordId, "NO_SOURCE", { detail: "No matching knowledge entry." });

    const checked = await writeTips({
      title: record.title,
      kind,
      species,
      age: formatAge(pet.birthDate, pet.birthDateApproximate),
      chunks: found.chunks,
    });
    if (checked.tips.length < MIN_TIPS) {
      const why = checked.dropped.map((d) => d.reason).join("; ").slice(0, 200);
      return finish(recordId, "FAILED", { detail: `Model output rejected. ${why}`.trim() });
    }

    const named = (text: string) =>
      text.replace(/\b[Yy]our pet's\b/g, `${pet.name}'s`).replace(/\b[Yy]our pet\b/g, pet.name);
    const first = found.chunks[0];
    await finish(recordId, "READY", {
      tips: checked.tips.map((t) => ({ text: named(t.text), sources: t.sources })),
      sources: [
        {
          key: found.entryKey,
          name: found.name,
          source: first.sourceName,
          url: first.sourceUrl,
          version: first.sourceVersion,
          reviewed: first.reviewed,
        },
      ],
      allergyNote: allergyMatches(pet.allergies, found) ? "allergy" : null,
      model: GENERATE_MODEL,
    });

    await notify({
      userId: pet.ownerId,
      type: "CARE_TIPS",
      title: `Care tips for ${pet.name}: ${record.title}`,
      body: "From curated sources. Not a replacement for your vet's instructions.",
      href: `/pets/${pet.id}/records/${record.id}`,
      dedupeKey: `care-tips:${record.id}`,
    }).catch((e) => console.error("Care tips notification failed", e));
    return "READY";
  } catch (e) {
    console.error("Care tips failed", recordId, e instanceof Error ? e.message : e);
    await prisma.careTip
      .update({
        where: { recordId },
        data: { status: "FAILED", detail: (e instanceof Error ? e.message : "Unknown error").slice(0, 300) },
      })
      .catch(() => {});
    return "FAILED";
  }
}

/**
 * Picks up vet records whose tip job never finished or never started (the response ended before
 * `after()` ran). There is no scheduler, so this runs when an owner's pages load, like
 * syncDueNotifications.
 */
export async function retryStaleCareTips(userId: string) {
  const stale = new Date(Date.now() - STALE_SECONDS * 1000);
  const day = new Date(Date.now() - 24 * 3_600_000);
  const records = await prisma.healthRecord.findMany({
    where: {
      source: "VET",
      type: { in: ["MEDICATION", "VACCINATION"] },
      voidedAt: null,
      createdAt: { gt: day, lt: stale },
      pet: { ...accessiblePets(userId), archivedAt: null },
      OR: [{ careTip: null }, { careTip: { status: "PENDING", updatedAt: { lt: stale } } }],
    },
    select: { id: true },
    take: 2,
  });
  for (const r of records) await generateCareTips(r.id);
}
