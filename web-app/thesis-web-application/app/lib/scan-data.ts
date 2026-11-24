import { prisma } from "./prisma";
import { fmtFull, startOfToday } from "./care";
import {
  BOOLEAN_SETTINGS,
  DEFAULT_SETTINGS,
  MAX_PUBLIC_NOTE,
  type PublicSettings,
  type ScanSource,
} from "./scan-view";

/** The pet's saved switches, or the defaults when it has never saved any. */
export async function getPublicSettings(petId: string): Promise<PublicSettings> {
  const row = await prisma.petPublicSettings.findUnique({ where: { petId } });
  if (!row) return DEFAULT_SETTINGS;
  return {
    ...Object.fromEntries(BOOLEAN_SETTINGS.map((k) => [k, row[k]])),
    publicNote: row.publicNote ?? "",
  } as PublicSettings;
}

/** Reads the owner's settings form. A switch that is missing from the form is off. */
export function settingsFromForm(fd: FormData): PublicSettings {
  const note = String(fd.get("publicNote") ?? "").trim().slice(0, MAX_PUBLIC_NOTE);
  return {
    ...Object.fromEntries(BOOLEAN_SETTINGS.map((k) => [k, fd.get(k) === "on"])),
    publicNote: note,
  } as PublicSettings;
}

/** Everything a scan page could show about a pet. Switches are applied later, by `applySettings`. */
export async function loadScanSource(petId: string): Promise<ScanSource | null> {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: {
      name: true,
      species: true,
      breed: true,
      sex: true,
      birthDate: true,
      birthDateApproximate: true,
      allergies: true,
      owner: { select: { name: true, city: true, phone: true } },
    },
  });
  if (!pet) return null;

  const today = startOfToday();
  const [vaccine, medications] = await Promise.all([
    prisma.healthRecord.findFirst({
      where: { petId, type: "VACCINATION", voidedAt: null },
      orderBy: { recordDate: "desc" },
      select: { title: true, recordDate: true, nextDueDate: true },
    }),
    prisma.healthRecord.findMany({
      where: {
        petId,
        type: "MEDICATION",
        voidedAt: null,
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      orderBy: { recordDate: "desc" },
      take: 5,
      select: { title: true, dose: true },
    }),
  ]);

  let vaccineStatus = "No vaccine records";
  if (vaccine) {
    if (vaccine.nextDueDate) {
      vaccineStatus =
        vaccine.nextDueDate < today
          ? `Overdue (was due ${fmtFull(vaccine.nextDueDate)})`
          : "Up to date";
    } else {
      vaccineStatus = `Last: ${vaccine.title}, ${fmtFull(vaccine.recordDate)}`;
    }
  }

  return {
    petName: pet.name,
    species: pet.species,
    breed: pet.breed,
    sex: pet.sex,
    birthDate: pet.birthDate,
    birthDateApproximate: pet.birthDateApproximate,
    allergies: pet.allergies,
    vaccineStatus,
    medication: medications.length
      ? medications.map((m) => (m.dose ? `${m.title} (${m.dose})` : m.title)).join(", ")
      : null,
    ownerFirstName: pet.owner.name.split(/\s+/)[0] ?? pet.owner.name,
    ownerCity: pet.owner.city,
    ownerHasPhone: Boolean(pet.owner.phone),
  };
}
