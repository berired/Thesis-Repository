import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { prisma } from "./prisma";
import { RECORD_LABEL, shortAge } from "./care";
import { fmtEdited, fmtFull, startOfDay } from "./time";
import { formatBytes } from "./upload-client";

/**
 * A printable one-animal health summary. It holds the animal's details, the vaccine and
 * medication overview, and every record (vet-submitted ones are marked, edits are noted, and
 * attached files are listed by name, not embedded).
 *
 * It is the same for the owner and for a caretaker: voided records are left out, and nothing
 * about the owner's contact details, lost-pet messages or reminders is included, so exporting
 * can never show someone more than the app does.
 */

const PAGE = { w: 595.28, h: 841.89 };
const MARGIN = 48;
const INK = rgb(0.13, 0.15, 0.17);
const MUTED = rgb(0.36, 0.39, 0.44);
const LINE = rgb(0.85, 0.87, 0.9);
const FOREST = rgb(0, 0.275, 0.16);
const VET_BG = rgb(0.9, 0.93, 0.98);
const VET_INK = rgb(0.16, 0.33, 0.62);

class Writer {
  pdf: PDFDocument;
  font!: PDFFont;
  bold!: PDFFont;
  page!: PDFPage;
  y = 0;
  private allowed!: Set<number>;

  private constructor(pdf: PDFDocument) {
    this.pdf = pdf;
  }

  static async create() {
    const w = new Writer(await PDFDocument.create());
    w.font = await w.pdf.embedFont(StandardFonts.Helvetica);
    w.bold = await w.pdf.embedFont(StandardFonts.HelveticaBold);
    w.allowed = new Set(w.font.getCharacterSet());
    w.addPage();
    return w;
  }

  addPage() {
    this.page = this.pdf.addPage([PAGE.w, PAGE.h]);
    this.y = PAGE.h - MARGIN;
  }

  /** Standard PDF fonts only cover Latin text; anything else becomes "?" instead of failing. */
  safe(text: string) {
    let out = "";
    for (const ch of text.replace(/\t/g, " ")) {
      out += this.allowed.has(ch.codePointAt(0)!) ? ch : "?";
    }
    return out;
  }

  ensure(height: number) {
    if (this.y - height < MARGIN + 20) this.addPage();
  }

  gap(h: number) {
    this.y -= h;
  }

  /** Wraps `text` to the page width, one line at a time, starting a new page when needed. */
  text(
    text: string,
    { size = 10, bold = false, color = INK, indent = 0, lead = 1.35 } = {},
  ) {
    const font = bold ? this.bold : this.font;
    const width = PAGE.w - MARGIN * 2 - indent;
    for (const paragraph of this.safe(text).split(/\r?\n/)) {
      let line = "";
      const flush = () => {
        this.ensure(size * lead);
        this.y -= size * lead;
        this.page.drawText(line, { x: MARGIN + indent, y: this.y, size, font, color });
        line = "";
      };
      for (const word of paragraph.split(" ")) {
        const next = line ? `${line} ${word}` : word;
        if (line && font.widthOfTextAtSize(next, size) > width) {
          flush();
          line = word;
        } else {
          line = next;
        }
      }
      flush();
    }
  }

  rule() {
    this.ensure(8);
    this.y -= 4;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE.w - MARGIN, y: this.y },
      thickness: 0.6,
      color: LINE,
    });
    this.y -= 6;
  }

  heading(text: string) {
    this.gap(8);
    this.ensure(30);
    this.text(text, { size: 14, bold: true, color: FOREST });
    this.rule();
  }

  /** A small filled label such as "VET-SUBMITTED", drawn at the current line. */
  badge(label: string, x: number, y: number) {
    const size = 7.5;
    const w = this.bold.widthOfTextAtSize(label, size) + 8;
    this.page.drawRectangle({ x, y: y - 3, width: w, height: 12, color: VET_BG });
    this.page.drawText(label, { x: x + 4, y, size, font: this.bold, color: VET_INK });
    return w;
  }

  finish() {
    const pages = this.pdf.getPages();
    pages.forEach((p, i) => {
      p.drawText(`Page ${i + 1} of ${pages.length}`, {
        x: PAGE.w - MARGIN - 50,
        y: 28,
        size: 8,
        font: this.font,
        color: MUTED,
      });
      p.drawText("Pawket Book. Not a diagnosis; ask your vet about any symptoms.", {
        x: MARGIN,
        y: 28,
        size: 8,
        font: this.font,
        color: MUTED,
      });
    });
    return this.pdf.save();
  }
}

/** The PDF bytes for one animal, or null when it doesn't exist. Access is checked by the caller. */
export async function buildPetSummaryPdf(petId: string): Promise<{ bytes: Uint8Array; name: string } | null> {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: {
      name: true,
      species: true,
      breed: true,
      sex: true,
      birthDate: true,
      birthDateApproximate: true,
      color: true,
      weightKg: true,
      microchip: true,
      allergies: true,
      medicalNotes: true,
      neutered: true,
      records: {
        where: { voidedAt: null },
        orderBy: [{ recordDate: "desc" }, { createdAt: "desc" }],
        include: {
          files: { orderBy: { uploadedAt: "asc" }, select: { fileName: true, sizeBytes: true } },
          edits: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
          addedNotes: {
            orderBy: { createdAt: "asc" },
            select: { body: true, createdAt: true, author: { select: { name: true } } },
          },
        },
      },
    },
  });
  if (!pet) return null;

  const w = await Writer.create();
  const today = startOfDay();

  w.text(`${pet.name}: health summary`, { size: 22, bold: true, color: FOREST });
  w.text(`Prepared ${fmtFull(new Date())}`, { size: 9, color: MUTED });
  w.gap(6);

  w.heading("About");
  const about: [string, string | null][] = [
    ["Species", [pet.species, pet.breed].filter(Boolean).join(", ")],
    ["Sex", pet.sex === "MALE" ? "Male" : "Female"],
    ["Born", `${fmtFull(pet.birthDate)}${pet.birthDateApproximate ? " (estimated)" : ""}, ${shortAge(pet.birthDate, pet.birthDateApproximate)}`],
    ["Colour", pet.color],
    ["Weight", pet.weightKg !== null ? `${pet.weightKg} kg` : null],
    ["Neutered", pet.neutered === null ? null : pet.neutered ? "Yes" : "No"],
    ["Microchip", pet.microchip],
  ];
  for (const [label, value] of about) {
    if (!value) continue;
    w.ensure(14);
    const y = w.y - 10 * 1.35;
    w.page.drawText(label, { x: MARGIN, y, size: 10, font: w.font, color: MUTED });
    w.text(value, { indent: 90 });
  }
  if (pet.medicalNotes) {
    w.gap(4);
    w.text(`Notes: ${pet.medicalNotes}`, { color: MUTED });
  }

  w.heading("Health at a glance");
  w.text("Allergies", { bold: true });
  w.text(pet.allergies?.trim() || "None recorded", { indent: 12 });
  w.gap(4);

  const vaccines = pet.records.filter((r) => r.type === "VACCINATION");
  w.text("Vaccinations", { bold: true });
  if (vaccines.length === 0) w.text("None recorded", { indent: 12 });
  for (const v of vaccines) {
    const parts = [fmtFull(v.recordDate), v.title];
    if (v.batchNumber) parts.push(`batch ${v.batchNumber}`);
    if (v.nextDueDate) parts.push(`next due ${fmtFull(v.nextDueDate)}`);
    w.text(parts.join("  |  "), { indent: 12 });
  }
  w.gap(4);

  const meds = pet.records.filter((r) => r.type === "MEDICATION" && (!r.endDate || r.endDate >= today));
  w.text("Current medication", { bold: true });
  if (meds.length === 0) w.text("None recorded", { indent: 12 });
  for (const m of meds) {
    const parts = [m.title];
    if (m.dose) parts.push(m.dose);
    parts.push(`from ${fmtFull(m.recordDate)}${m.endDate ? ` to ${fmtFull(m.endDate)}` : ""}`);
    w.text(parts.join("  |  "), { indent: 12 });
  }

  w.heading(`All records (${pet.records.length})`);
  if (pet.records.length === 0) w.text("No health records yet.", { color: MUTED });

  for (const r of pet.records) {
    const fromVet = r.source === "VET";
    w.gap(6);
    w.ensure(60);

    // Date and type on the left, the vet mark on the right of the same line.
    const headY = w.y - 10 * 1.35;
    if (fromVet) w.badge("VET-SUBMITTED", PAGE.w - MARGIN - 78, headY);
    w.text(`${fmtFull(r.recordDate)}  |  ${RECORD_LABEL[r.type]}`, { size: 9, color: MUTED });
    w.text(r.title, { size: 12, bold: true });

    const details: [string, string | null][] = [
      [fromVet ? "Vet" : "Clinic", fromVet ? r.vetName : r.clinic],
      ["Clinic", fromVet ? r.clinic : null],
      ["Dose", r.dose],
      ["End date", r.endDate ? fmtFull(r.endDate) : null],
      ["Batch / lot no.", r.batchNumber],
      ["Next dose due", r.nextDueDate ? fmtFull(r.nextDueDate) : null],
      ["Weight", r.weightKg !== null ? `${r.weightKg} kg` : null],
    ];
    for (const [label, value] of details) if (value) w.text(`${label}: ${value}`, { indent: 10 });
    if (r.notes) w.text(`Notes: ${r.notes}`, { indent: 10 });
    for (const n of r.addedNotes) {
      w.text(`Added note (${n.author?.name ?? "someone"}, ${fmtEdited(n.createdAt)}): ${n.body}`, {
        indent: 10,
        color: MUTED,
      });
    }
    if (r.files.length > 0) {
      w.text(`Attached files (${r.files.length}, not included here):`, { indent: 10, color: MUTED });
      for (const f of r.files) w.text(`- ${f.fileName} (${formatBytes(f.sizeBytes)})`, { indent: 22, color: MUTED });
    }
    if (r.edits[0]) w.text(`Edited on ${fmtEdited(r.edits[0].createdAt)}`, { size: 8.5, indent: 10, color: MUTED });
    w.rule();
  }

  return { bytes: await w.finish(), name: pet.name };
}
