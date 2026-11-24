import type { CSSProperties } from "react";

/**
 * A whole number that counts up from 0 when it appears. It is done in CSS (an animated integer
 * shown through a counter), so there is no client code, no flash of the final number first, and
 * the real value is in the page for screen readers and when animations are switched off.
 */
export default function CountUp({ value }: { value: number }) {
  return (
    <>
      <span aria-hidden="true" className="count-up" style={{ "--target": value } as CSSProperties} />
      <span className="sr-only">{value}</span>
    </>
  );
}

/** A ring that fills to `percent` (0 to 100) as it appears. Drawn at 64px; size it with className. */
export function ProgressRing({
  percent,
  className = "size-16",
}: {
  percent: number;
  className?: string;
}) {
  const filled = Math.max(0, Math.min(100, percent));
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className={`${className} shrink-0 -rotate-90`}>
      <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3.5" />
      <circle
        cx="18"
        cy="18"
        r="15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${filled} 100`}
        className="ring-fill"
      />
    </svg>
  );
}
