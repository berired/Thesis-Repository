"use client";

/**
 * A pill switch that slides between off and on. It is a real checkbox underneath,
 * so it works inside plain forms and with the keyboard.
 */
export default function Switch({
  name,
  label,
  defaultChecked,
  onChange,
  onTrackClass = "peer-checked:bg-sky",
  labelClassName = "text-ink",
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Full Tailwind class for the track colour when on, e.g. "peer-checked:bg-sky". */
  onTrackClass?: string;
  labelClassName?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        role="switch"
        name={name}
        defaultChecked={defaultChecked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`relative h-7 w-[52px] shrink-0 rounded-full bg-[#9aa2ac] transition-colors duration-200 after:absolute after:left-0.5 after:top-0.5 after:size-6 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-6 peer-focus-visible:ring-2 peer-focus-visible:ring-butter peer-focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:after:transition-none ${onTrackClass}`}
      />
      <span className={`text-sm font-semibold ${labelClassName}`}>{label}</span>
    </label>
  );
}
