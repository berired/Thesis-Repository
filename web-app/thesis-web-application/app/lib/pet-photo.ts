import sharp from "sharp";
import { newFileKey } from "./pet-files";
import { deletePetPhoto, deleteFile, getPetPhotoUrl, presignFileDownload, putFile } from "./storage";

/**
 * Pet profile photos. The browser sends the original; the server checks that it really is a
 * JPG, PNG or WebP picture, turns it upright, strips its metadata (location, camera), and
 * stores two WebP copies in the private files bucket: a large one (up to 1200 px) and a small
 * square thumbnail (256 px) for avatars. Photos are only ever served through signed URLs.
 *
 * Photos saved before this existed are `pet-photos/<id>.<ext>` in the original bucket. They keep
 * working (see `petPhotoUrl`) and are replaced on the next upload.
 */

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const FORMATS = new Set(["jpeg", "png", "webp"]);
const LARGE_PX = 1200;
const THUMB_PX = 256;
// A decompression-bomb guard: refuse pictures with more than 50 million pixels.
const MAX_PIXELS = 50_000_000;

export type SavedPhoto =
  | { ok: true; photoKey: string; photoThumbKey: string }
  | { ok: false; error: string };

/** Refuses a photo that is too big or isn't a readable JPG, PNG or WebP, without storing anything. */
export async function checkPetPhoto(file: File): Promise<{ ok: true } | { ok: false; error: string }> {
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: "Photo must be 5 MB or smaller." };
  try {
    const meta = await sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: MAX_PIXELS,
    }).metadata();
    if (!meta.format || !FORMATS.has(meta.format)) {
      return { ok: false, error: "Photo must be a JPG, PNG or WebP image." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "We couldn't read that photo. Try a different JPG, PNG or WebP image." };
  }
}

/** Validates, resizes and stores a photo for a pet. Returns the keys to save on the pet. */
export async function savePetPhoto(petId: string, file: File): Promise<SavedPhoto> {
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: "Photo must be 5 MB or smaller." };
  const input = Buffer.from(await file.arrayBuffer());

  let large: Buffer;
  let thumb: Buffer;
  try {
    // The real format comes from the bytes, never from the file name or the browser's claim.
    const meta = await sharp(input, { limitInputPixels: MAX_PIXELS }).metadata();
    if (!meta.format || !FORMATS.has(meta.format)) {
      return { ok: false, error: "Photo must be a JPG, PNG or WebP image." };
    }
    const base = () => sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "error" }).rotate();
    large = await base()
      .resize({ width: LARGE_PX, height: LARGE_PX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    thumb = await base()
      .resize({ width: THUMB_PX, height: THUMB_PX, fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return { ok: false, error: "We couldn't read that photo. Try a different JPG, PNG or WebP image." };
  }

  const stem = newFileKey("photo", petId, "webp").replace(/\.webp$/, "");
  const photoKey = `${stem}-large.webp`;
  const photoThumbKey = `${stem}-thumb.webp`;
  try {
    await putFile(photoKey, large, "image/webp");
    await putFile(photoThumbKey, thumb, "image/webp");
  } catch (e) {
    console.error("Pet photo upload failed", e);
    await deletePhotoObjects([photoKey, photoThumbKey]);
    return { ok: false, error: "We couldn't upload the photo. Try again." };
  }
  return { ok: true, photoKey, photoThumbKey };
}

/** Deletes stored photo objects (new or older), ignoring ones that are already gone. */
export async function deletePhotoObjects(keys: (string | null | undefined)[]) {
  await Promise.allSettled(
    keys
      .filter((k): k is string => Boolean(k))
      .map((k) => (k.startsWith("photos/") ? deleteFile(k) : deletePetPhoto(k))),
  );
}

/** A short-lived URL for one stored photo, from whichever bucket it lives in. */
export function petPhotoUrl(key: string, expiresInSeconds = 300) {
  return key.startsWith("photos/")
    ? presignFileDownload(key, undefined, expiresInSeconds)
    : getPetPhotoUrl(key, expiresInSeconds);
}
