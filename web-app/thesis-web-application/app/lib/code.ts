/**
 * Tag codes, shared by the server and the browser (no database here).
 * A code is 12 characters from an alphabet without look-alikes (see qr.ts), carried by a QR
 * code or an NFC tag as a link: https://<app>/r/<code>.
 */

export const CODE_PATTERN = /^[2-9a-hj-km-np-z]{12}$/;

/** Accepts a bare code or a full /r/<code> URL (what the scanner returns). Not validated. */
export function extractCode(raw: string) {
  const trimmed = raw.trim();
  const match = trimmed.match(/\/r\/([a-z0-9]+)\/?(?:[?#].*)?$/i);
  return (match ? match[1] : trimmed).toLowerCase();
}

/** The code inside text read from a tag or QR code, or null when it doesn't hold a valid one. */
export function codeFromText(raw: string): string | null {
  const code = extractCode(raw);
  return CODE_PATTERN.test(code) ? code : null;
}
