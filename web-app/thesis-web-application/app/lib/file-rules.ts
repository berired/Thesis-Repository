/**
 * Upload rules shared by the server (which enforces them) and the browser
 * (which uses them to reject a bad file before wasting an upload).
 */

export type FileKind = "document" | "vet-upload" | "photo";

const MB = 1024 * 1024;

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

/** For the file input's `accept` attribute. */
export const DOCUMENT_ACCEPT = "application/pdf,image/jpeg,image/png";

export type UploadCheck = { ok: true; ext: string } | { ok: false; error: string };

export function checkUpload(kind: FileKind, contentType: string, sizeBytes: number): UploadCheck {
  const rule = RULES[kind];
  const ext = rule.types[contentType];
  if (!ext) {
    if (contentType.startsWith("video/")) return { ok: false, error: "Can't attach video files." };
    return {
      ok: false,
      error: kind === "photo" ? "Photos must be JPG, PNG or WebP." : "Files must be PDF, JPG or PNG.",
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
