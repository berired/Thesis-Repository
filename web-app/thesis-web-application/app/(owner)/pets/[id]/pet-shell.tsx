import Link from "next/link";
import OwnerPage from "@/app/components/owner-page";
import Icon from "@/app/components/icon";
import { PetAvatar, petPhotoSrc, styleFor } from "@/app/components/pet-avatar";
import { StickerLink } from "@/app/components/ui";
import { shortAge } from "@/app/lib/care";
import { restorePet } from "@/app/(owner)/actions";
import type { getOwnedPet } from "@/app/lib/pet-data";
import QrTag from "./qr-tag";
import LostModeToggle from "./lost-mode-toggle";

type Pet = Awaited<ReturnType<typeof getOwnedPet>>;
export type PetTab = "overview" | "records" | "appointments";

const LOCKED_TITLE = "Coming soon";

function Chip({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span
      className={`flex h-[26px] items-center gap-1 rounded-full px-2.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

const GHOST_BUTTON =
  "flex h-10 items-center gap-2 rounded-xl border border-[#c3c9d1] bg-white px-[18px] text-[15px] font-semibold text-ink";

/** Everything the pet pages share: breadcrumb, banner and tab bar. */
export default function PetShell({
  pet,
  active,
  crumb,
  children,
}: {
  pet: Pet;
  active: PetTab;
  /** Extra breadcrumb segment for sub-pages, e.g. "Health records". */
  crumb?: string;
  children: React.ReactNode;
}) {
  const style = styleFor(pet.species);
  const base = `/pets/${pet.id}`;
  const crumbs = [
    { label: "My animals", href: "/pets" },
    crumb ? { label: pet.name, href: base } : { label: pet.name },
    ...(crumb ? [{ label: crumb }] : []),
  ];

  const tabs: { key: string; label: string; href?: string; count?: number }[] = [
    { key: "overview", label: "Overview", href: base },
    { key: "records", label: "Health records", href: `${base}/records`, count: pet._count.records },
    { key: "reminders", label: "Reminders", count: pet._count.reminders },
    { key: "appointments", label: "Appointments", href: `${base}/appointments` },
    { key: "id", label: "ID and QR tag" },
  ];

  const big = active === "overview";

  return (
    <OwnerPage crumbs={crumbs}>
      {pet.archivedAt ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#c3c9d1] bg-white px-4 py-3 text-sm">
          <Icon name="archive" size={16} className="text-muted" />
          <span className="flex-1">
            {pet.name} is archived: hidden from your lists, with reminders paused.
          </span>
          <form action={restorePet.bind(null, pet.id)}>
            <button type="submit" className="font-semibold text-sky underline">
              Restore {pet.name}
            </button>
          </form>
        </div>
      ) : null}

      <section className="flex flex-col gap-4 rounded-3xl bg-forest px-5 py-5 sm:px-8 sm:py-7 xl:flex-row xl:items-center xl:gap-6">
        {big ? (
          <span
            className={`flex size-[116px] shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-white shadow-[6px_6px_0_var(--color-butter)]`}
          >
            <PetAvatar name={pet.name} species={pet.species} size={104} photoSrc={petPhotoSrc(pet)} />
          </span>
        ) : (
          <PetAvatar
            name={pet.name}
            species={pet.species}
            size={64}
            photoSrc={petPhotoSrc(pet)}
            className="border-[3px] border-white shadow-[4px_4px_0_var(--color-blush)]"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1
            className={`truncate font-display text-butter ${
              big ? "text-[40px] leading-[44px] sm:text-[56px] sm:leading-[56px]" : "text-[32px] leading-9 sm:text-[40px] sm:leading-10"
            }`}
          >
            {pet.name}
          </h1>
          {big ? (
            <div className="flex flex-wrap gap-2">
              <Chip className={`${style.badge} ${style.text}`}>{pet.species}</Chip>
              {pet.breed ? <Chip className="bg-[#ede4d0] text-ink">{pet.breed}</Chip> : null}
              <Chip className="bg-[#ede4d0] text-ink">
                {pet.sex === "MALE" ? "Male" : "Female"} ·{" "}
                {shortAge(pet.birthDate, pet.birthDateApproximate)}
              </Chip>
            </div>
          ) : null}
          {big ? (
            <div className="mt-1">
              <LostModeToggle petId={pet.id} petName={pet.name} lost={pet.lostMode} />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-[9px]">
          {big ? (
            <>
              <Link href={`${base}/edit`} className={GHOST_BUTTON}>
                <Icon name="pencil" size={16} />
                Edit
              </Link>
              <QrTag
                code = {pet.qrCode?.code ?? null}
                petName = {pet.name}
                className = {GHOST_BUTTON}
              />
            </>
          ) : null}
          {active === "appointments" ? (
            <StickerLink href={`${base}/appointments/new`} rotate={-3}>
              <Icon name="calendar-plus" size={18} />
              Book appointment
            </StickerLink>
          ) : (
            <StickerLink href={`${base}/records/new`} rotate={-3}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/plus.svg" alt="" width={18} height={18} />
              Add record
            </StickerLink>
          )}
        </div>
      </section>

      <nav aria-label="Pet sections" className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          const inner = (
            <>
              {tab.label}
              {tab.count !== undefined ? (
                <span className="rounded-full bg-[#e6eefb] px-1.5 py-px text-[11px] font-medium text-[#2a559e]">
                  {tab.count}
                </span>
              ) : null}
            </>
          );
          const cls = "-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm";
          return tab.href ? (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`${cls} ${
                isActive
                  ? "border-sky font-semibold text-sky"
                  : "border-transparent font-medium text-muted hover:text-ink"
              }`}
            >
              {inner}
            </Link>
          ) : (
            <span
              key={tab.key}
              aria-disabled="true"
              title={LOCKED_TITLE}
              className={`${cls} cursor-not-allowed select-none border-transparent font-medium text-[#a0a7b0]`}
            >
              {inner}
            </span>
          );
        })}
      </nav>

      {children}
    </OwnerPage>
  );
}
