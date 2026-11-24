import { shortAge } from "./care";

/**
 * What a stranger sees after scanning a lost pet's tag.
 *
 * `applySettings` is the one place that decides it: the public scan page and the owner's
 * live preview both call it, so the preview cannot show something the page would not.
 * It is pure (no database), and every field comes back null unless its switch is on.
 */

export type PublicSettings = {
  showName: boolean;
  showSpecies: boolean;
  showAge: boolean;
  showGender: boolean;
  showOwnerName: boolean;
  showCity: boolean;
  allowCall: boolean;
  allowMessage: boolean;
  showAllergies: boolean;
  showVaccines: boolean;
  showMedication: boolean;
  showNotes: boolean;
  publicNote: string;
};

/** Used for a pet that has never saved its settings: basics and in-app messages on, health and phone off. */
export const DEFAULT_SETTINGS: PublicSettings = {
  showName: true,
  showSpecies: true,
  showAge: true,
  showGender: true,
  showOwnerName: true,
  showCity: false,
  allowCall: false,
  allowMessage: true,
  showAllergies: false,
  showVaccines: false,
  showMedication: false,
  showNotes: false,
  publicNote: "",
};

export const BOOLEAN_SETTINGS = [
  "showName",
  "showSpecies",
  "showAge",
  "showGender",
  "showOwnerName",
  "showCity",
  "allowCall",
  "allowMessage",
  "showAllergies",
  "showVaccines",
  "showMedication",
  "showNotes",
] as const;

export const MAX_PUBLIC_NOTE = 200;

/** The switches as the owner sees them, grouped like the Figma "When someone scans it" card. */
export const SETTING_GROUPS: {
  title: string;
  items: { key: (typeof BOOLEAN_SETTINGS)[number]; label: string }[];
}[] = [
  {
    title: "Pet information",
    items: [
      { key: "showName", label: "Pet's name" },
      { key: "showSpecies", label: "Species" },
      { key: "showAge", label: "Age" },
      { key: "showGender", label: "Gender" },
    ],
  },
  {
    title: "Lost pet contact",
    items: [
      { key: "showOwnerName", label: "Your first name" },
      { key: "showCity", label: "Your city" },
      { key: "allowCall", label: "Allow finders to SMS or call me" },
      { key: "allowMessage", label: "Message me through Pawket Book" },
    ],
  },
  {
    title: "Vet health summary",
    items: [
      { key: "showAllergies", label: "Allergies" },
      { key: "showVaccines", label: "Vaccine status" },
      { key: "showMedication", label: "Current medication" },
      { key: "showNotes", label: "Additional notes" },
    ],
  },
];

/** The facts about a pet and its owner that a scan page could show, before any switch is applied. */
export type ScanSource = {
  petName: string;
  species: string;
  breed: string | null;
  sex: "MALE" | "FEMALE";
  birthDate: Date;
  birthDateApproximate: boolean;
  allergies: string | null;
  vaccineStatus: string;
  medication: string | null;
  ownerFirstName: string;
  ownerCity: string | null;
  ownerHasPhone: boolean;
};

export type ScanView = {
  name: string | null;
  species: string | null;
  ageGender: string | null;
  owner: string | null;
  ownerFirstName: string | null;
  allergies: string | null;
  vaccines: string | null;
  medication: string | null;
  note: string | null;
  /** Show the text and call buttons: switched on and the owner has a number. */
  canCall: boolean;
  canMessage: boolean;
};

export function applySettings(src: ScanSource, s: PublicSettings): ScanView {
  const age = s.showAge ? shortAge(src.birthDate, src.birthDateApproximate) : null;
  const gender = s.showGender ? (src.sex === "MALE" ? "male" : "female") : null;
  const ownerName = s.showOwnerName ? src.ownerFirstName : null;
  const city = s.showCity ? src.ownerCity : null;
  const note = s.publicNote.trim();

  return {
    name: s.showName ? src.petName : null,
    species: s.showSpecies ? [src.species, src.breed].filter(Boolean).join(" · ") : null,
    ageGender: [age, gender].filter(Boolean).join(" · ") || null,
    owner: [ownerName, city].filter(Boolean).join(" · ") || null,
    ownerFirstName: ownerName,
    allergies: s.showAllergies ? (src.allergies?.trim() || "None recorded") : null,
    vaccines: s.showVaccines ? src.vaccineStatus : null,
    medication: s.showMedication ? (src.medication ?? "None recorded") : null,
    note: s.showNotes && note ? note : null,
    canCall: s.allowCall && src.ownerHasPhone,
    canMessage: s.allowMessage,
  };
}
