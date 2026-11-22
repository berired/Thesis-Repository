import { randomUUID } from "node:crypto";
import { deleteFile, headFile, presignFileUpload } from "./storage";

/**
 * Upload rules for the private `pet-files` bucket. Nothing here knows who the
 * user is: callers check access with getPetAccess first, then use these.
 */

export type FileKind = "document" | "vet-upload" | "photo";

const MB = 1024 * 1024;

const PREFIX: Record<FileKind, string> = {
  document: "documents",
  "vet-upload": "vet-uploads",
  photo: "photos",
};

const RULES: Record<FileKind, { types: Record<string, string>; maxBytes: number }> = {
  document: {
    types: { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" },
    maxBytes: 10 * MB,
  },
  "vet-upload": {
    types: { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" },
    maxBytes: 10 * MB,
  },
  photo: {
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
    maxBytes: 5 * MB,
  },
};

/** At most this many files hang off one health record. */
export const MAX_FILES_PER_RECORD = 5;

export type UploadCheck = { ok: true; ext: string } | { ok: false; error: string };

/** The type and size rules, enforced on the server before a URL is issued. */
export function checkUpload(kind: FileKind, contentType: string, sizeBytes: number): UploadCheck {
  const rule = RULES[kind];
  const ext = rule.types[contentType];
  if (!ext) {
    return {
      ok: false,
      error:
        kind === "photo"
          ? "Photos must be JPG, PNG or WebP."
          : "Files must be PDF, JPG or PNG.",
    };
  }
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, error: "That file is empty." };
  }
  if (sizeBytes > rule.maxBytes) {
    return { ok: false, error: `Files must be ${rule.maxBytes / MB} MB or smaller.` };
  }
  return { ok: true, ext };
}

/** Keys are server-made (`documents/<petId>/<uuid>.pdf`); the client never picks one. */
export function newFileKey(kind: FileKind, petId: string, ext: string) {
  return `${PREFIX[kind]}/${petId}/${randomUUID()}.${ext}`;
}

/** True only for a key this module would have issued for that pet and kind. */
export function keyBelongsToPet(key: string, kind: FileKind, petId: string) {
  return key.startsWith(`${PREFIX[kind]}/${petId}/`) && !key.includes("..");
}

export type PresignedUpload =
  | { ok: true; key: string; url: string; headers: Record<string, string> }
  | { ok: false; error: string };

/** Validates the file, then issues a 5 minute URL for exactly that type and size. */
export async function createUpload(
  kind: FileKind,
  petId: string,
  contentType: string,
  sizeBytes: number,
): Promise<PresignedUpload> {
  const check = checkUpload(kind, contentType, sizeBytes);
  if (!check.ok) return check;
  const key = newFileKey(kind, petId, check.ext);
  const url = await presignFileUpload(key, contentType, sizeBytes);
  return {
    ok: true,
    key,
    url,
    headers: { "Content-Type": contentType, "Content-Length": String(sizeBytes) },
  };
}

/**
 * Called after the browser says it finished: checks that what landed in the
 * bucket matches the rules, and deletes it if not. Never trust the client's word.
 */
export async function verifyUploaded(
  kind: FileKind,
  key: string,
): Promise<{ ok: true; contentType: string; sizeBytes: number } | { ok: false; error: string }> {
  const stored = await headFile(key);
  if (!stored) return { ok: false, error: "The upload didn't finish. Try again." };
  const check = checkUpload(kind, stored.contentType, stored.sizeBytes);
  if (!check.ok) {
    await deleteFile(key).catch((e) => console.error("Rejected upload cleanup failed", e));
    return check;
  }
  return { ok: true, contentType: stored.contentType, sizeBytes: stored.sizeBytes };
}
