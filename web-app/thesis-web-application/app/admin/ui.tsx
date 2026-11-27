import Link from "next/link";

/* Shared pieces for the admin pages, built from the same tokens as the owner side:
   cream page, white cards with a line border, Darumadrop titles, sky primary buttons. */

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 print:hidden">
      {back ? (
        <Link href={back.href} className="w-fit text-sm font-medium text-sky hover:underline">
          &larr; {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[36px] leading-[40px] text-forest sm:text-[44px] sm:leading-[48px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-[21px] text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export const CARD = "rounded-2xl border border-line bg-white";

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={`${CARD} p-5 ${className}`}>{children}</section>;
}

/** A white card that holds a table and scrolls sideways on narrow screens. */
export function TableCard({
  children,
  minWidth = "40rem",
}: {
  children: React.ReactNode;
  minWidth?: string;
}) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-ink" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-cream/70 text-[12.5px] font-semibold text-muted">
      <tr>{children}</tr>
    </thead>
  );
}

export function TH({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`whitespace-nowrap px-4 py-3 font-semibold ${className}`}>{children}</th>;
}

export const ROW = "border-t border-line align-top transition-colors hover:bg-[#fbf8f1]";
export const TD = "px-4 py-3";

export function EmptyRow({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <tr className="border-t border-line">
      <td colSpan={cols} className="px-4 py-10 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${CARD} px-4 py-10 text-center text-sm text-muted`}>{children}</div>
  );
}

const PILL_TONES = {
  green: "bg-lime-soft text-lime-ink",
  pink: "bg-blush-soft text-blush-ink",
  yellow: "bg-butter-soft text-butter-ink",
  blue: "bg-[#e6eefb] text-[#2a559e]",
  gray: "bg-[#eef1f4] text-muted",
} as const;

export function Pill({
  tone = "gray",
  children,
}: {
  tone?: keyof typeof PILL_TONES;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${PILL_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/* Buttons: the small versions of the owner side's sky, outline and danger buttons. */

const BTN =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-60";

export const BTN_PRIMARY = `${BTN} bg-sky text-white hover:bg-[#2d5aa8]`;
export const BTN_OUTLINE = `${BTN} border border-[#c3c9d1] bg-white text-ink hover:bg-[#f6f8fa]`;
export const BTN_DANGER = `${BTN} border border-[#e8b4b0] bg-white text-[#c2372e] hover:bg-[#fdf1f0]`;
export const BTN_DANGER_SOLID = `${BTN} bg-[#c2372e] text-white hover:bg-[#a52d25]`;

export const FIELD =
  "h-9 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-[#a0a7b0] focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30";

export const TEXTAREA =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-[#a0a7b0] focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30";

export const MONO = "font-mono text-[13px] tabular-nums";
