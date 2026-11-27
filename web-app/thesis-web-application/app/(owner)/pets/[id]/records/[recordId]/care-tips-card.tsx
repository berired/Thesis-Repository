import Icon from "@/app/components/app-icon";
import { fmtDay, fmtTime } from "@/app/lib/care";
import DismissTips from "./dismiss-tips";

type Tip = { text: string; sources: string[] };
type Source = { key: string; name: string; source: string; url: string; version: string; reviewed: boolean };

/**
 * Owner-friendly tips for a vet-saved medicine or vaccine, written from the curated knowledge
 * base (see app/lib/care-tips). Only shown once the tips are ready; a record with no matching
 * source simply has no card, never a generic one.
 */
export default function CareTipsCard({
  recordId,
  petName,
  title,
  tips,
  sources,
  allergyNote,
  nextDose,
  canDismiss,
}: {
  recordId: string;
  petName: string;
  title: string;
  tips: unknown;
  sources: unknown;
  allergyNote: boolean;
  nextDose: Date | null;
  canDismiss: boolean;
}) {
  const list = (Array.isArray(tips) ? tips : []) as Tip[];
  const origin = (Array.isArray(sources) ? sources : []) as Source[];
  if (list.length === 0) return null;
  const reviewed = origin.length > 0 && origin.every((s) => s.reviewed);

  return (
    <section
      aria-labelledby="care-tips-heading"
      className="flex max-w-[700px] flex-col gap-3 rounded-xl border border-line bg-white p-5"
    >
      <h2 id="care-tips-heading" className="flex items-center gap-2 text-lg font-semibold leading-6">
        <Icon name="paw-print" size={18} className="text-forest" />
        Care tips for {petName}&apos;s {title}
      </h2>

      {allergyNote ? (
        <p role="note" className="rounded-lg bg-[#fff6d1] px-3 py-2 text-[13px] leading-[19px] text-[#7a5a00]">
          {petName}&apos;s profile lists an allergy that may relate to this medicine. Check with your
          vet before giving it.
        </p>
      ) : null}

      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-[21px]">
        {list.map((t, i) => (
          <li key={i}>{t.text}</li>
        ))}
        {nextDose ? (
          <li>
            Next dose: <span className="font-semibold">{fmtDay(nextDose)}, {fmtTime(nextDose)}</span>.
          </li>
        ) : null}
      </ul>

      <div className="flex flex-col gap-1 border-t border-line pt-3 text-xs leading-[18px] text-muted">
        {origin.map((s) => (
          <p key={s.key}>
            Source:{" "}
            <a href={s.url} target="_blank" rel="noreferrer" className="underline hover:text-ink">
              {s.source}
            </a>{" "}
            ({s.version})
          </p>
        ))}
        <p>
          General guidance from curated sources.{" "}
          {reviewed ? "" : "Not reviewed by a veterinarian. "}
          It does not replace your vet&apos;s instructions. If you are unsure, or your pet seems unwell,
          contact your vet.
        </p>
      </div>

      {canDismiss ? <DismissTips recordId={recordId} /> : null}
    </section>
  );
}
