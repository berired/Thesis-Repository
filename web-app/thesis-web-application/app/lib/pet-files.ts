import { randomUUID } from "node:crypto";
import { checkUpload, type FileKind } from "./file-rules";
import { deleteFile, headFile, presignFileUpload } from "./storage";

export { MAX_FILES_PER_RECORD } from "./file-rules";
export type { FileKind } from "./file-rules";

/**
 * Upload rules for the private `pet-files` bucket (the rules themselves live in
 * file-rules.ts so the browser can share them). Nothing here knows who the user
 * is: callers check access with getPetAccess first, then use these.
 */

const PREFIX: Record<FileKind, string> = {
  document: "documents",
  "vet-upload": "vet-uploads",
  photo: "photos",
};

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
