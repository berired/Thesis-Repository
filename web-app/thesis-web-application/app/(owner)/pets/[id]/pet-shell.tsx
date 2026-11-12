import Link from "next/link";
import OwnerPage from "@/app/components/owner-page";
import Icon from "@/app/components/icon";
import { PetAvatar, styleFor } from "@/app/components/pet-avatar";
import { StickerLink } from "@/app/components/ui";
import { shortAge } from "@/app/lib/care";
import { restorePet } from "@/app/(owner)/actions";
import type { getOwnedPet } from "@/app/lib/pet-data";

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

function Locked({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-disabled="true"
      title={LOCKED_TITLE}
      className={`${GHOST_BUTTON} cursor-not-allowed select-none !text-[#a0a7b0]`}
    >
      {children}
    </span>
  );
}

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
    { label: "My animals", href: "/dashboard" },
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

      <section className="flex items-center gap-6 rounded-3xl bg-forest px-8 py-7">
        {big ? (
          <span
            className={`flex size-[116px] shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-white shadow-[6px_6px_0_var(--color-butter)]`}
          >
            <PetAvatar name={pet.name} species={pet.species} size={104} />
          </span>
        ) : (
          <PetAvatar
            name={pet.name}
            species={pet.species}
            size={64}
            className="border-[3px] border-white shadow-[4px_4px_0_var(--color-blush)]"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1
            className={`truncate font-display text-butter ${
              big ? "text-[56px] leading-[56px]" : "text-[40px] leading-10"
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
        </div>

        <div className="flex shrink-0 items-center gap-[9px]">
          {big ? (
            <>
              <Locked>
                <Icon name="pencil" size={16} />
                Edit
              </Locked>
              <Locked>
                <Icon name="qr-code" size={16} />
                QR tag
              </Locked>
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

      <nav aria-label="Pet sections" className="flex gap-1 border-b border-line">
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
          const cls = "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm";
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
