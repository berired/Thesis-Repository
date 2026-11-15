/**
 * Checks a contact number typed by a person. Accepts digits with an optional
 * leading +, spaces, dashes and brackets, and 7 to 15 digits in total.
 * Returns the tidied number, or null when it doesn't look like a phone number.
 */
export function cleanPhone(raw: string): string | null {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!/^\+?[\d\s\-()]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15 ? value : null;
}

export const PHONE_ERROR = "Enter a valid contact number, e.g. 0917 555 0123.";
