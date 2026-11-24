import { prisma } from "./prisma";
import type { PetSex } from "../generated/prisma/client";

export type PetInput = {
  name: string;
  species: string;
  breed: string | null;
  color: string;
  sex: PetSex;
  birthDate: Date;
  birthDateApproximate: boolean;
  neutered: boolean | null;
  weightKg: number | null;
  microchip: string | null;
  markings: string | null;
  allergies: string | null;
  medicalNotes: string | null;
};

export type ClaimResult =
  | { ok: true; petId: string }
  | { ok: false; error: string };

// Claims the QR and creates the pet in one transaction. The conditional
// updateMany makes the claim atomic: only one request can flip UNUSED -> CLAIMED.
export async function claimQrAndCreatePet(
  ownerId: string,
  code: string,
  pet: PetInput,
  /** The serial number of the NFC tag the owner tapped, if the code came from a tap. */
  nfcSerial: string | null = null,
): Promise<ClaimResult> {
  const qr = await prisma.qrCode.findUnique({ where: { code } });
  if (!qr) return { ok: false, error: "That QR code isn't recognised." };
  if (qr.status === "REVOKED") {
    return { ok: false, error: "That QR code has been revoked." };
  }
  if (qr.status === "CLAIMED") {
    return { ok: false, error: "That QR code is already registered to a pet." };
  }

  // A tapped tag must be the physical tag the admin set up for this code. A typed or scanned
  // code carries no serial, so it isn't checked.
  if (nfcSerial && qr.nfcSerial && nfcSerial !== qr.nfcSerial) {
    return { ok: false, error: "This isn't the NFC tag that was set up for that code." };
  }

  try {
    const petId = await prisma.$transaction(async (tx) => {
      const { count } = await tx.qrCode.updateMany({
        where: { id: qr.id, status: "UNUSED" },
        data: {
          status: "CLAIMED",
          claimedAt: new Date(),
          // Remember the chip the first time one is tapped.
          ...(nfcSerial && !qr.nfcSerial ? { nfcSerial } : {}),
        },
      });
      if (count === 0) throw new Error("QR_TAKEN");
      const created = await tx.pet.create({
        data: { ...pet, ownerId, qrCodeId: qr.id },
      });
      return created.id;
    });
    return { ok: true, petId };
  } catch (e) {
    if (e instanceof Error && e.message === "QR_TAKEN") {
      return { ok: false, error: "That QR code was just registered by someone else." };
    }
    throw e;
  }
}

export { extractCode } from "./code";
