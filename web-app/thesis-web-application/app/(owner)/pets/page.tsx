import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import { SPECIES } from "@/app/lib/pets";
import OwnerPage from "@/app/components/owner-page";
import Icon from "@/app/components/icon";
import PetCard, { nextThing } from "@/app/components/pet-card";
import SortSelect from "./sort-select";

const CHIP_ICON: Record<string, string | null> = {
  Dog: "/icons/chip-dog.svg",
  Cat: "/icons/chip-cat.svg",
  Bird: "/icons/chip-bird.svg",
  Poultry: "/icons/chip-egg.svg",
  Reptile: "/icons/chip-turtle.svg",
  Fish: "/icons/chip-fish.svg",
  Rabbit: "/icons/chip-rabbit.svg",
  Other: null,
};

const PLURAL: Record<string, string> = {
  Dog: "Dogs",
  Cat: "Cats",
  Bird: "Birds",
  Poultry: "Poultry",
  Reptile: "Reptiles",
  Fish: "Fish",
  Rabbit: "Rabbits",
  Other: "Other",
};

type Search = { species?: string; sort?: string; view?: string };

export default async function MyAnimalsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await requireUser();
  const params = await searchParams;
  const sort = ["due", "name", "newest"].includes(params.sort ?? "") ? params.sort! : "due";
  const view = params.view === "list" ? "list" : "grid";
  const now = new Date();

  const pets = await prisma.pet.findMany({
    where: { ownerId: session.user.id, archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      reminders: { where: { completedAt: null }, orderBy: { dueAt: "asc" }, take: 1 },
      appointments: {
        where: { status: { in: ["AWAITING_CLINIC", "CONFIRMED"] }, scheduledAt: { gte: now } },
        orderBy: { scheduledAt: "asc" },
        take: 1,
      },
    },
  });

  // Chips only for species the owner actually has, in the design's order.
  const present = SPECIES.filter((s) => pets.some((p) => p.species === s));
  const species = present.includes(params.species ?? "") ? params.species! : null;

  const shown = pets.filter((p) => !species || p.species === species);
  if (sort === "name") shown.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "due") {
    const when = (p: (typeof pets)[number]) => nextThing(p, now)?.at.getTime() ?? Infinity;
    shown.sort((a, b) => when(a) - when(b));
  }

  const href = (next: Partial<Search>) => {
    const merged = { species: species ?? undefined, sort, view, ...next };
    const qs = new URLSearchParams();
    if (merged.species) qs.set("species", merged.species);
    if (merged.sort && merged.sort !== "due") qs.set("sort", merged.sort);
    if (merged.view && merged.view !== "grid") qs.set("view", merged.view);
    const s = qs.toString();
    return s ? `/pets?${s}` : "/pets";
  };

  const chip = "flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium";
  const chipOn = "border-sky bg-[#e8f0fc] text-sky";
  const chipOff = "border-transparent text-ink hover:bg-white";
  const segment = "flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium";

  return (
    <OwnerPage>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[44px] leading-[48px] text-forest">My animals</h1>
          <p className="mt-1 text-xs text-muted">
            {pets.length} {pets.length === 1 ? "animal" : "animals"}
          </p>
        </div>
        <Link
          href="/pets/new"
          className="inline-flex -rotate-3 items-center gap-1.5 rounded-full border-2 border-ink bg-butter px-3.5 pb-[9px] pt-[7px] font-display text-xl leading-5 text-ink shadow-[3px_3px_0_var(--color-ink)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/plus.svg" alt="" width={18} height={18} />
          Add animal
        </Link>
      </div>

      {pets.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Filter by kind" className="flex flex-wrap items-center gap-1.5">
            <Link
              href={href({ species: undefined })}
              aria-current={!species ? "true" : undefined}
              className={`${chip} ${!species ? chipOn : chipOff}`}
            >
              {!species ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/icons/chip-check.svg" alt="" width={13} height={13} />
              ) : null}
              All
            </Link>
            {present.map((s) => (
              <Link
                key={s}
                href={href({ species: s })}
                aria-current={species === s ? "true" : undefined}
                className={`${chip} ${species === s ? chipOn : chipOff}`}
              >
                {CHIP_ICON[s] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={CHIP_ICON[s]!} alt="" width={13} height={13} />
                ) : (
                  <Icon name="paw-print" size={13} />
                )}
                {PLURAL[s]}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <SortSelect
              value={sort}
              hrefs={{
                due: href({ sort: "due" }),
                name: href({ sort: "name" }),
                newest: href({ sort: "newest" }),
              }}
            />
            <div className="flex rounded-lg border border-line bg-white p-0.5">
              <Link
                href={href({ view: "grid" })}
                aria-current={view === "grid" ? "true" : undefined}
                className={`${segment} ${view === "grid" ? "bg-[#eef0f3] font-semibold" : "text-muted"}`}
              >
                Grid
              </Link>
              <Link
                href={href({ view: "list" })}
                aria-current={view === "list" ? "true" : undefined}
                className={`${segment} ${view === "list" ? "bg-[#eef0f3] font-semibold" : "text-muted"}`}
              >
                List
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <ul
        className={
          view === "list" ? "flex flex-col gap-4" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        }
      >
        {shown.map((pet) => (
          <li key={pet.id}>
            <PetCard pet={pet} now={now} />
          </li>
        ))}
        <li>
          <Link
            href="/pets/new"
            className="flex h-full min-h-[118px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#c9c2b0] bg-[#f3ecdc] text-sm font-medium text-muted hover:border-forest hover:text-ink"
          >
            <Icon name="plus" size={16} />
            Add another animal
          </Link>
        </li>
      </ul>

      <section className="mt-auto flex items-center gap-6 rounded-2xl bg-forest px-8 py-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="font-display text-[28px] leading-[30px] text-butter">Share the care</h2>
          <p className="text-[13px] leading-5 text-white">
            Invite family or a pet sitter as a caretaker. They can tick off reminders and see
            records.
          </p>
        </div>
        <span
          aria-disabled="true"
          title="Coming soon"
          className="flex h-9 shrink-0 cursor-default items-center gap-2 rounded-lg border border-[#c3c9d1] bg-white px-4 text-[13px] font-semibold text-ink"
        >
          <Icon name="users" size={14} />
          Invite caretaker
        </span>
      </section>
    </OwnerPage>
  );
}
