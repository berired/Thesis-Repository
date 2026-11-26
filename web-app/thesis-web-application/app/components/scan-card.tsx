import Icon from "@/app/components/app-icon";
import { PetAvatar } from "@/app/components/pet-avatar";
import type { ScanView } from "@/app/lib/scan-view";

/**
 * The "Member card" a stranger sees after scanning a lost pet's tag (Figma 203:4866).
 * Shared by the public scan page and the owner's live preview. It only draws what
 * `applySettings` returned; the buttons come in through `actions` so the preview can show
 * inert ones.
 */
export default function ScanCard({
  view,
  lost,
  species,
  memberNo,
  photoUrl,
  actions,
}: {
  view: ScanView;
  /** Lost mode only adds the red badge and the "found me" wording; the card is otherwise the same. */
  lost: boolean;
  /** Only picks the avatar picture, and only while the species switch is on. */
  species: string;
  memberNo: string;
  photoUrl: string | null;
  actions: React.ReactNode;
}) {
  const rows: [string, string | null][] = [
    ["Name", view.name],
    ["Species", view.species],
    ["Age & gender", view.ageGender],
    ["Owner", view.owner],
  ];
  const health: [string, string | null][] = [
    ["Allergies", view.allergies],
    ["Vaccines", view.vaccines],
    ["Medication", view.medication],
    ["Note from the owner", view.note],
  ];
  const shownHealth = health.filter(([, value]) => value);

  return (
    <div className="flex w-full flex-col gap-4 rounded-[20px] border-2 border-ink bg-cream p-5 text-left text-ink shadow-[8px_8px_0_var(--color-butter)]">
      <div className="flex items-center justify-between border-b-2 border-ink pb-2 text-[13px] font-semibold">
        <span>Member card</span>
        <span className="font-mono uppercase">No. {memberNo}</span>
      </div>

      {lost ? (
        <p className="mx-auto flex w-fit items-center gap-1.5 rounded-full border-2 border-ink bg-[#c2372e] px-3 py-1 text-[13px] font-semibold text-white">
          <Icon name="circle-alert" size={14} />
          Marked as lost
        </p>
      ) : null}

      <div className="flex items-start gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="The pet"
            className="size-[104px] shrink-0 -rotate-3 rounded-sm border-2 border-ink bg-white object-cover p-1"
          />
        ) : (
          <span className="flex size-[104px] shrink-0 -rotate-3 items-center justify-center rounded-sm border-2 border-ink bg-white p-1">
            <PetAvatar name={view.name ?? "Pet"} species={view.species ? species : ""} size={88} />
          </span>
        )}
        <dl className="flex min-w-0 flex-1 flex-col gap-2">
          {rows
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="border-b border-dashed border-[#c9c2b0] pb-1">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="break-words text-[15px] font-semibold leading-5">{value}</dd>
              </div>
            ))}
        </dl>
      </div>

      {shownHealth.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-semibold">Health at a glance</h2>
          {shownHealth.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between gap-3 border-b border-[#e2dccb] pb-1 text-sm"
            >
              <span className="text-muted">{label}</span>
              <span className="text-right font-semibold">{value}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2.5 rounded-xl border-2 border-ink bg-white p-4">
        <h2 className="text-[15px] font-semibold">
          {lost ? "Found me? Please tell" : "Need to reach"} {view.ownerFirstName ?? "my owner"}
        </h2>
        {actions}
      </div>
    </div>
  );
}

const BUTTON = "flex h-11 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold";
export const SMS_BUTTON = `${BUTTON} bg-sky text-white`;
export const CALL_BUTTON = `${BUTTON} border-2 border-ink bg-butter text-ink`;
export const MESSAGE_BUTTON = `${BUTTON} border border-[#c3c9d1] bg-white text-sky`;
