import { codeFromText } from "./code";

/**
 * Reading and writing NFC tags in the browser (Web NFC). It only exists in Chrome on Android,
 * over HTTPS, and every call needs a tap on a button first. Other phones can still use a tag:
 * a tag that holds our link opens the scan page when tapped with the phone's normal reader.
 */

export const NFC_UNSUPPORTED =
  "Reading NFC tags in the browser works in Chrome on Android. On other phones, scan the QR code, or tap the tag with your phone's normal NFC reader to open it.";

export type TagRead = {
  /** The chip's own serial number, e.g. "04:a2:...". Null if the browser didn't give one. */
  serial: string | null;
  /** The Pawket Book code found on the tag, or null if the tag holds something else. */
  code: string | null;
};

export function nfcAvailable() {
  return typeof window !== "undefined" && window.isSecureContext && "NDEFReader" in window;
}

function decode(record: NDEFRecordLike): string | null {
  if (!record.data || !["url", "absolute-url", "text"].includes(record.recordType)) return null;
  try {
    return new TextDecoder(record.encoding ?? "utf-8").decode(record.data);
  } catch {
    return null;
  }
}

/** The first valid tag code among a tag's records. Anything that isn't a code is ignored. */
export function codeFromRecords(records: readonly NDEFRecordLike[]): string | null {
  for (const record of records) {
    const text = decode(record);
    const code = text ? codeFromText(text) : null;
    if (code) return code;
  }
  return null;
}

/** A plain-language message for the errors the NFC API throws. */
export function nfcErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : error instanceof Error ? error.name : "";
  if (name === "NotAllowedError") return "NFC is blocked. Allow NFC for this site in your browser settings and try again.";
  if (name === "NotSupportedError") return "This phone doesn't support NFC, or NFC is switched off.";
  if (name === "NotReadableError") return "We couldn't read that tag. Hold it steady against the back of the phone.";
  if (name === "NetworkError") return "The tag moved away before it was written. Hold it still and try again.";
  return error instanceof Error && error.message ? error.message : "Something went wrong with the NFC tag.";
}

/** Waits for one tag to be tapped, then stops listening. */
export function readTag(signal?: AbortSignal): Promise<TagRead> {
  return new Promise((resolve, reject) => {
    const stop = new AbortController();
    signal?.addEventListener("abort", () => stop.abort(), { once: true });
    const reader = new NDEFReader();
    reader.addEventListener("reading", (event) => {
      const e = event as NDEFReadingEventLike;
      stop.abort();
      resolve({ serial: e.serialNumber || null, code: codeFromRecords(e.message.records) });
    });
    reader.addEventListener("readingerror", () => {
      stop.abort();
      reject(new DOMException("unreadable", "NotReadableError"));
    });
    reader.scan({ signal: stop.signal }).catch((error) => {
      if (!stop.signal.aborted) reject(error);
      else if (signal?.aborted) reject(new DOMException("cancelled", "AbortError"));
    });
  });
}

/**
 * Writes our link onto a tag (replacing what is on it) and returns the chip's serial number.
 * The tag must stay against the phone for the whole thing. `lock` makes it read-only for good,
 * where the browser supports that.
 */
export async function writeTag(
  url: string,
  options: { lock?: boolean; signal?: AbortSignal } = {},
): Promise<{ serial: string | null; locked: boolean }> {
  const first = await readTag(options.signal);
  const reader = new NDEFReader();
  await reader.write(
    { records: [{ recordType: "url", data: url }] },
    { overwrite: true, signal: options.signal },
  );
  let locked = false;
  if (options.lock && typeof reader.makeReadOnly === "function") {
    await reader.makeReadOnly({ signal: options.signal });
    locked = true;
  }
  return { serial: first.serial, locked };
}
