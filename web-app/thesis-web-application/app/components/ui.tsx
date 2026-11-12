import Link from "next/link";

/* Shared "scrapbook" pieces from the Pawket Book designs. */

const TAPE = {
  yellow: "bg-butter",
  blue: "bg-powder",
  pink: "bg-blush",
} as const;

const OFFSET_SHADOW = {
  yellow: "shadow-[5px_5px_0_var(--color-butter)]",
  pink: "shadow-[5px_5px_0_var(--color-blush)]",
} as const;

type Polaroid = {
  caption: string;
  tape: keyof typeof TAPE;
  shadow: keyof typeof OFFSET_SHADOW;
  /** Rotation of the whole card, in degrees. */
  rotate?: number;
  /** Rotation of the strip of tape, in degrees. */
  tapeRotate?: number;
  /** Where the tape sits along the top edge, e.g. "left-1/3". */
  tapePosition?: string;
  /** Tailwind classes sizing the card, e.g. "w-[300px]". */
  className?: string;
  /** Tailwind height class for the photo area. */
  photo?: string;
  /** Use the hand-lettered display font for the caption. */
  displayCaption?: boolean;
  /** Optional label shown under the placeholder icon. */
  placeholderLabel?: string;
};

/** Photo placeholder card. Swap the placeholder for a real <img> later. */
export function Polaroid({
  caption,
  tape,
  shadow,
  rotate = 0,
  tapeRotate = 0,
  tapePosition = "left-1/3",
  className = "",
  photo = "h-[200px]",
  displayCaption = false,
  placeholderLabel,
}: Polaroid) {
  return (
    <figure
      aria-hidden="true"
      style={{ transform: `rotate(${rotate}deg)` }}
      className={`relative flex flex-col gap-2.5 rounded-md bg-white px-3 pb-4 pt-3 ${OFFSET_SHADOW[shadow]} ${className}`}
    >
      <span
        style={{ transform: `rotate(${tapeRotate}deg)` }}
        className={`absolute -top-3.5 h-[26px] w-[90px] ${tapePosition} ${TAPE[tape]}`}
      />
      <div
        className={`relative flex flex-col items-center justify-center gap-1 bg-[rgba(127,127,127,0.08)] p-3 ${photo}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/image-placeholder.svg" alt="" width={28} height={28} />
        {placeholderLabel ? (
          <span className="text-[11.9px] font-medium opacity-75">
            {placeholderLabel}
          </span>
        ) : null}
        <span className="pointer-events-none absolute inset-0 border border-dashed border-ink opacity-35" />
      </div>
      <figcaption
        className={
          displayCaption
            ? "font-display text-[28px] leading-[30.8px] text-ink"
            : "text-[15px] font-semibold leading-[22.5px] text-ink"
        }
      >
        {caption}
      </figcaption>
    </figure>
  );
}

const STICKER_COLORS = {
  yellow: "bg-butter",
  pink: "bg-blush",
  blue: "bg-powder",
} as const;

const STICKER_BASE =
  "inline-flex items-center gap-1.5 border-2 border-ink px-3.5 pb-[9px] pt-[7px] font-display text-xl leading-5 text-ink shadow-[3px_3px_0_var(--color-ink)]";

type StickerProps = {
  color?: keyof typeof STICKER_COLORS;
  /** "pill" for buttons, "tag" for the squarer labels. */
  shape?: "pill" | "tag";
  rotate?: number;
  className?: string;
  children: React.ReactNode;
};

function stickerClass({
  color = "yellow",
  shape = "pill",
  className = "",
}: StickerProps) {
  return `${STICKER_BASE} ${STICKER_COLORS[color]} ${
    shape === "pill" ? "rounded-full" : "rounded-xl"
  } ${className}`;
}

/** A tilted label that isn't interactive. */
export function Sticker(props: StickerProps) {
  return (
    <span
      className={stickerClass(props)}
      style={{ transform: `rotate(${props.rotate ?? 0}deg)` }}
    >
      {props.children}
    </span>
  );
}

/** A tilted link styled as a sticker button. */
export function StickerLink({
  href,
  ...props
}: StickerProps & { href: string }) {
  return (
    <Link
      href={href}
      className={stickerClass(props)}
      style={{ transform: `rotate(${props.rotate ?? -3}deg)` }}
    >
      {props.children}
    </Link>
  );
}

/** The raised white card that holds every auth form. */
export function AuthCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-[20px] border-2 border-ink bg-white p-8 shadow-[8px_8px_0_var(--color-butter)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-display text-[30px] leading-[30px] tracking-[0.3px] text-butter ${className}`}
    >
      Pawket Book
    </Link>
  );
}

/* Form pieces ------------------------------------------------------------ */

export const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink placeholder:text-[#a0a7b0] focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30";

export const PRIMARY_BUTTON_CLASS =
  "flex h-12 w-full items-center justify-center rounded-xl bg-sky px-6 text-base font-semibold text-white hover:bg-[#2d5aa8] disabled:cursor-not-allowed disabled:opacity-60";

export const SECONDARY_BUTTON_CLASS =
  "flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#c3c9d1] bg-white px-[18px] text-[15px] font-semibold text-ink hover:bg-[#f6f8fa] disabled:opacity-60";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[13px] font-medium leading-[19.5px] text-ink">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="text-xs leading-[16.8px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

type IconLayer = {
  src: string;
  /** CSS inset of the layer inside the icon box, as exported from Figma. */
  inset: string;
  /** Negative inset the SVG bleeds past the layer (stroke overflow). */
  bleed: string;
};

/**
 * Some Figma icons export as several vector layers positioned inside a square.
 * This stacks them with the same insets so they line up as designed.
 */
export function LayerIcon({
  size,
  layers,
  className = "",
}: {
  size: number;
  layers: IconLayer[];
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`relative block shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {layers.map((layer, i) => (
        <span key={i} className="absolute" style={{ inset: layer.inset }}>
          <span className="absolute" style={{ inset: layer.bleed }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={layer.src} alt="" className="block size-full max-w-none" />
          </span>
        </span>
      ))}
    </span>
  );
}

export const PAW_LAYERS: IconLayer[] = [
  { src: "/icons/paw-a.svg", inset: "8.33% 45.83% 75% 37.5%", bleed: "-25%" },
  { src: "/icons/paw-a.svg", inset: "25% 16.67% 58.33% 66.67%", bleed: "-25%" },
  { src: "/icons/paw-a.svg", inset: "58.33% 8.33% 25% 75%", bleed: "-25%" },
  { src: "/icons/paw-b.svg", inset: "41.67% 41.67% 8.34% 8.36%", bleed: "-8.33% -8.34%" },
];

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-[13px] text-muted">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-[#c2372e]">
      {message}
    </p>
  );
}

export function GoogleButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={SECONDARY_BUTTON_CLASS}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/google.svg" alt="" width={18} height={18} />
      Continue with Google
    </button>
  );
}
