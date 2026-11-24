/**
 * One time zone for the whole app. Servers run in UTC (Vercel) and owners are in
 * the Philippines, so anything that depends on "which day is it" or "what time was
 * that" is worked out here instead of with the server's local clock.
 *
 * Pure functions only, so client components can use them too.
 */
export const APP_TIME_ZONE = "Asia/Manila";

type Parts = { year: number; month: number; day: number; hour: number; minute: number };

const partsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

/** The wall-clock date and time an instant has in the app time zone. */
export function zonedParts(d: Date): Parts {
  const out: Record<string, number> = {};
  for (const p of partsFormat.formatToParts(d)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return { year: out.year, month: out.month, day: out.day, hour: out.hour, minute: out.minute };
}

/** The instant at which the app time zone's clock reads this date and time. */
export function fromZoned(year: number, month: number, day: number, hour = 0, minute = 0) {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  // The zone's offset at that moment; checked twice so a daylight-saving jump still lands right.
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(new Date(guess));
    const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess = asUtc - (shown - guess);
  }
  return new Date(guess);
}

/** Midnight at the start of the app-zone day containing `now`. */
export function startOfDay(now = new Date()) {
  const p = zonedParts(now);
  return fromZoned(p.year, p.month, p.day);
}

/** Midnight at the end of the app-zone day containing `now`. */
export function endOfDay(now = new Date()) {
  const p = zonedParts(now);
  return fromZoned(p.year, p.month, p.day + 1);
}

/** yyyy-mm-dd for today in the app time zone, for date inputs. */
export function todayInput(now = new Date()) {
  const p = zonedParts(now);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** hh:mm in the app time zone, for time inputs. */
export function timeInput(d: Date) {
  const p = zonedParts(d);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** Parses "yyyy-mm-dd" plus "hh:mm" (or a "yyyy-mm-ddThh:mm" string) as app-zone time. */
export function parseZoned(date: string, time = "00:00") {
  const [d, t] = date.includes("T") ? date.split("T") : [date, time];
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d ?? "");
  const tm = /^(\d{2}):(\d{2})/.exec(t ?? "");
  if (!dm || !tm) return null;
  const [y, mo, da, h, mi] = [dm[1], dm[2], dm[3], tm[1], tm[2]].map(Number);
  if (mo < 1 || mo > 12 || da < 1 || da > 31 || h > 23 || mi > 59) return null;
  const out = fromZoned(y, mo, da, h, mi);
  // Rejects dates the calendar doesn't have, such as 31 February.
  const back = zonedParts(out);
  return back.month === mo && back.day === da ? out : null;
}

/** A date plus N days, months or years, on the app-zone calendar and clock. */
export function addZoned(d: Date, unit: "day" | "month" | "year", n: number) {
  const p = zonedParts(d);
  if (unit === "day") return fromZoned(p.year, p.month, p.day + n, p.hour, p.minute);
  // Months and years: clamp to the month's last day (31 Jan + 1 month = 28 Feb, 29 Feb + 1 year = 28 Feb).
  const total = p.year * 12 + (p.month - 1) + (unit === "year" ? 12 * n : n);
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  const last = zonedParts(fromZoned(year, month + 1, 0)).day;
  return fromZoned(year, month, Math.min(p.day, last), p.hour, p.minute);
}

const fmt = (options: Intl.DateTimeFormatOptions, locale = "en-GB") =>
  new Intl.DateTimeFormat(locale, { timeZone: APP_TIME_ZONE, ...options });

const dayFmt = fmt({ day: "numeric", month: "short" });
const fullFmt = fmt({ day: "numeric", month: "short", year: "numeric" });
const timeFmt = fmt({ hour: "numeric", minute: "2-digit" }, "en-US");
const editedFmt = fmt(
  { month: "2-digit", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" },
  "en-US",
);
const monthFmt = fmt({ month: "short" });
const weekdayFmt = fmt({ weekday: "short" });
const headingFmt = fmt({ weekday: "short", day: "numeric", month: "short" });

export const fmtDay = (d: Date) => dayFmt.format(d);
export const fmtFull = (d: Date) => fullFmt.format(d);
export const fmtTime = (d: Date) => timeFmt.format(d);
/** "11/24/2026, 3:04 PM": the stamp on an edited record. */
export const fmtEdited = (d: Date) => editedFmt.format(d);
export const monthShort = (d: Date) => monthFmt.format(d);
export const weekdayShort = (d: Date) => weekdayFmt.format(d);
export const fmtHeading = (d: Date) => headingFmt.format(d);
export const dayOfMonth = (d: Date) => zonedParts(d).day;
export const yearOf = (d: Date) => zonedParts(d).year;
export const hourOf = (d: Date) => zonedParts(d).hour;
/** Same value for every instant on the same app-zone calendar day. */
export const dayKey = (d: Date) => startOfDay(d).getTime();
