import { checkUpload } from "./file-rules";

export type UploadResult = { ok: true; documentId: string } | { ok: false; error: string };

/** PUTs one file to its presigned URL, reporting 0-100 as it goes. */
function putWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(file);
  });
}

/**
 * Presign, upload, confirm: the three steps of an owner upload, attached to a record.
 * The server re-checks everything, so the early check here is only for a quicker error.
 */
export async function uploadRecordFile(
  petId: string,
  recordId: string,
  file: File,
  documentType: string,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  const early = checkUpload("document", file.type, file.size);
  if (!early.ok) return early;

  try {
    const presign = await fetch(`/api/pets/${petId}/documents/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
    });
    const presigned = await presign.json().catch(() => null);
    if (!presign.ok) return { ok: false, error: presigned?.error ?? "Couldn't start the upload." };

    const uploaded = await putWithProgress(presigned.url, file, onProgress);
    if (!uploaded) return { ok: false, error: "The upload didn't finish. Try again." };

    const confirm = await fetch(`/api/pets/${petId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: presigned.key,
        fileName: file.name,
        title: file.name,
        type: documentType,
        recordId,
      }),
    });
    const doc = await confirm.json().catch(() => null);
    if (!confirm.ok) return { ok: false, error: doc?.error ?? "Couldn't save the file." };
    return { ok: true, documentId: doc.id };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Check your connection." };
  }
}

/** A record's files default to the matching document category. */
export function documentTypeFor(recordType: string) {
  if (recordType === "VACCINATION" || recordType === "VET_VISIT" || recordType === "LAB_RESULT") {
    return recordType;
  }
  return "OTHER";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The vet's version of an upload: same three steps, but through the QR session
 * (the cookie) instead of an owner login, and always attached to the submitted record.
 */
export async function uploadVetFile(
  token: string,
  file: File,
  documentType: string,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  const early = checkUpload("vet-upload", file.type, file.size);
  if (!early.ok) return early;

  try {
    const presign = await fetch(`/api/vet/${token}/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
    });
    const presigned = await presign.json().catch(() => null);
    if (!presign.ok) return { ok: false, error: presigned?.error ?? "Couldn't start the upload." };

    const uploaded = await putWithProgress(presigned.url, file, onProgress);
    if (!uploaded) return { ok: false, error: "The upload didn't finish. Try again." };

    const confirm = await fetch(`/api/vet/${token}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: presigned.key, fileName: file.name, type: documentType }),
    });
    const doc = await confirm.json().catch(() => null);
    if (!confirm.ok) return { ok: false, error: doc?.error ?? "Couldn't save the file." };
    return { ok: true, documentId: doc.id };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Check your connection." };
  }
}
