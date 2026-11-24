import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "./prisma";
import type { VetSection } from "../generated/prisma/client";

/**
 * The vet QR flow. A link carries a random token (256 bits; only its hash is stored).
 * Opening the link is harmless; tapping Start burns it and begins a short cookie-bound
 * session; submitting one record spends the QR.
 */
export const LINK_HOURS = 24;
export const SESSION_MINUTES = 45;
export const MAX_ACTIVE_PER_PET = 5;
export const MAX_UPLOADS_PER_SESSION = 10;
export const SESSION_COOKIE = "vet_session";

export const SECTION_LABEL: Record<VetSection, string> = {
  ALLERGIES: "Allergies",
  VACCINES: "Vaccine status",
  MEDICATION: "Current medication",
  NOTES: "Additional notes",
};
export const SECTIONS = Object.keys(SECTION_LABEL) as VetSection[];

export const newToken = () => randomBytes(32).toString("base64url");
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * The address the person making a request is using, such as https://pawketbook.vercel.app.
 *
 * A vet QR is made on the spot and must open on the same site that holds its token, so its link
 * uses this instead of the fixed APP_URL setting (which is wrong on a preview, on localhost or
 * after a tunnel address changes, and then the QR points nowhere). For a server action, Next has
 * already checked that the Origin matches the host, so this cannot be pointed somewhere else by
 * the caller. APP_URL is only the last resort.
 */
export async function requestOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin && /^https?:\/\/[^/\s]+$/i.test(origin)) return origin;
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  if (/^[a-z0-9.-]+(:\d+)?$/i.test(host)) {
    const proto = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim();
    return `${proto === "http" || proto === "https" ? proto : "https"}://${host}`;
  }
  return process.env.APP_URL ?? "";
}

export function vetUrl(token: string, origin: string) {
  return `${origin.replace(/\/+$/, "")}/v/${token}`;
}

/** A link that is still waiting for a vet: not revoked, not spent, not expired. */
export function activeWhere(now = new Date()) {
  return { revokedAt: null, usedAt: null, expiresAt: { gt: now } } as const;
}

const requestInclude = {
  pet: {
    select: {
      id: true,
      name: true,
      species: true,
      breed: true,
      sex: true,
      birthDate: true,
      birthDateApproximate: true,
      allergies: true,
      medicalNotes: true,
      ownerId: true,
    },
  },
} as const;

export function findRequest(token: string) {
  return prisma.recordRequest.findUnique({
    where: { tokenHash: sha256(token) },
    include: requestInclude,
  });
}

type Found = NonNullable<Awaited<ReturnType<typeof findRequest>>>;

export type VetState =
  | { kind: "unknown" }
  | { kind: "revoked" | "used" | "burned" | "expired"; request: Found }
  | { kind: "fresh"; request: Found }
  | { kind: "session"; request: Found; submitted: boolean };

function sessionMatches(request: Found, cookie: string | undefined, now: Date) {
  if (!cookie || !request.sessionHash || !request.sessionExpiresAt) return false;
  if (request.sessionExpiresAt <= now) return false;
  const [id, secret] = cookie.split(".");
  if (id !== request.id || !secret) return false;
  const a = Buffer.from(sha256(secret));
  const b = Buffer.from(request.sessionHash);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** What a visitor with this token (and this cookie) is allowed to do. Never writes. */
export async function vetState(token: string, cookie: string | undefined): Promise<VetState> {
  const request = await findRequest(token);
  if (!request) return { kind: "unknown" };
  const now = new Date();
  if (request.revokedAt) return { kind: "revoked", request };
  if (sessionMatches(request, cookie, now)) {
    return { kind: "session", request, submitted: request.usedAt !== null };
  }
  if (request.usedAt) return { kind: "used", request };
  if (request.burnedAt) return { kind: "burned", request };
  if (request.expiresAt <= now) return { kind: "expired", request };
  return { kind: "fresh", request };
}

export async function currentVetState(token: string) {
  return vetState(token, (await cookies()).get(SESSION_COOKIE)?.value);
}
