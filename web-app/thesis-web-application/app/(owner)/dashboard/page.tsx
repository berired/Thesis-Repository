import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import { formatAge } from "@/app/lib/pets";

type SpeciesStyle = {
  avatar: string;
  badge: string;
  text: string;
  avatarIcon: string | null;
  badgeIcon: string | null;
};

const SPECIES_STYLE: Record<string, SpeciesStyle> = {
  Dog: {
    avatar: "bg-butter-soft",
    badge: "bg-butter-soft",
    text: "text-butter-ink",
    avatarIcon: "/icons/dog-avatar.svg",
    badgeIcon: "/icons/dog-badge.svg",
  },
  Cat: {
    avatar: "bg-blush-soft",
    badge: "bg-blush-soft",
    text: "text-blush-ink",
    avatarIcon: "/icons/cat-avatar.svg",
    badgeIcon: "/icons/cat-badge.svg",
  },
  Reptile: {
    avatar: "bg-lime-soft",
    badge: "bg-lime-soft",
    text: "text-lime-ink",
    avatarIcon: "/icons/reptile-avatar.svg",
    badgeIcon: "/icons/reptile-badge.svg",
  },
};

// Design only ships icons for dog, cat and reptile; other species fall back
// to an initial in the avatar and a text-only badge.
const FALLBACK_STYLE: SpeciesStyle = {
  avatar: "bg-butter-soft",
  badge: "bg-butter-soft",
  text: "text-butter-ink",
  avatarIcon: null,
  badgeIcon: null,
};

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const STEPS = [
  {
    n: 1,
    title: "Add an animal",
    body: "Name, species, birthday and a photo.",
    color: "bg-butter",
  },
  {
    n: 2,
    title: "Log their health",
    body: "Add past vaccines and vet visits.",
    color: "bg-blush",
  },
  {
    n: 3,
    title: "Set a reminder",
    body: "Feeding, meds or deworming that repeats.",
    color: "bg-powder",
  },
];

function AddAnimalButton() {
  return (
    <Link
      href="/pets/new"
      className="inline-flex -rotate-3 items-center gap-1.5 rounded-full border-2 border-ink bg-butter px-3.5 pb-[9px] pt-[7px] font-display text-xl leading-5 text-ink shadow-[3px_3px_0_var(--color-ink)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/plus.svg" alt="" width={18} height={18} />
      Add animal
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await requireUser();
  const firstName = session.user.name.split(/\s+/)[0];

  const pets = await prisma.pet.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  if (pets.length === 0) {
    return (
      <>
        <section className="flex items-center gap-12 rounded-3xl bg-forest px-12 py-12 text-white">
          <div className="flex min-w-0 max-w-[560px] flex-1 flex-col items-start">
            <p className="text-[15px] font-medium leading-[22.5px]">
              Hi {firstName}, your account is ready.
            </p>
            <h1 className="mt-4 font-display text-6xl leading-[0.805] text-butter md:text-[96px]">
              <span className="block">Let&apos;s add</span>
              <span className="block">your first</span>
              <span className="block">animal</span>
            </h1>
            <p className="mt-5 max-w-[440px] text-[17px] leading-[25.5px]">
              Dog, cat, hen, lizard or goldfish, they all get a profile, health
              records and reminders.
            </p>
            <div className="mt-6 pl-1">
              <AddAnimalButton />
            </div>
          </div>

          <div
            aria-hidden="true"
            className="ml-auto hidden w-[340px] shrink-0 justify-center lg:flex"
          >
            <div className="relative w-[290px] rotate-5 rounded-lg bg-white px-3.5 pb-[18px] pt-3.5 shadow-[6px_6px_0_var(--color-butter)]">
              <div className="absolute -top-[18px] left-1/2 h-7 w-[100px] -translate-x-1/2 -rotate-3 bg-blush" />
              <div className="relative flex h-60 items-center justify-center bg-[rgba(127,127,127,0.08)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/image-placeholder.svg"
                  alt=""
                  width={28}
                  height={28}
                />
                <div className="pointer-events-none absolute inset-0 border border-dashed border-ink opacity-35" />
              </div>
              <p className="mt-[11px] text-base font-semibold leading-6 text-ink">
                caption here
              </p>
            </div>
          </div>
        </section>

        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="flex items-start gap-3.5 rounded-2xl border border-line bg-white p-[22px]"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-ink text-[15px] font-semibold text-ink ${step.color}`}
              >
                {step.n}
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold leading-6">{step.title}</p>
                <p className="text-[13px] leading-[19.5px] text-muted">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </>
    );
  }

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <section className="flex items-center gap-6 rounded-3xl bg-forest px-8 py-7">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-sm font-medium leading-[21px] text-white">
            {dateLabel}
          </p>
          <h1 className="font-display text-5xl leading-none text-butter md:text-[56px]">
            {greeting(now.getHours())}, {firstName}
          </h1>
          <p className="text-base leading-6 text-white">
            You have {pets.length} {pets.length === 1 ? "animal" : "animals"} on
            Pawket Book.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-[9px]">
          <span
            aria-disabled="true"
            className="flex h-10 cursor-default items-center gap-2 rounded-xl border border-[#c3c9d1] bg-white px-[18px] text-[15px] font-semibold text-ink"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/map-pin.svg" alt="" width={18} height={18} />
            Find a vet
          </span>
          <AddAnimalButton />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[30px] leading-[33px] text-forest">
          Your animals
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pets.map((pet) => {
            const style = SPECIES_STYLE[pet.species] ?? FALLBACK_STYLE;
            return (
              <li key={pet.id}>
                <Link
                  href={`/pets/${pet.id}`}
                  className="flex h-full items-center gap-3.5 rounded-xl border border-line bg-white p-5 hover:border-forest"
                >
                  <span
                    className={`flex size-14 shrink-0 items-center justify-center overflow-clip rounded-full text-lg font-semibold ${style.avatar} ${style.text}`}
                  >
                    {style.avatarIcon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={style.avatarIcon} alt="" width={28} height={28} />
                    ) : (
                      pet.name[0]?.toUpperCase()
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-lg font-semibold leading-[23.4px]">
                      {pet.name}
                    </span>
                    <span className="truncate text-[13px] leading-[19.5px] text-muted">
                      {pet.breed ? `${pet.breed} · ` : ""}
                      {formatAge(pet.birthDate, pet.birthDateApproximate)}
                    </span>
                  </span>
                  <span
                    className={`flex h-[26px] shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium ${style.badge} ${style.text}`}
                  >
                    {style.badgeIcon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={style.badgeIcon} alt="" width={13} height={13} />
                    ) : null}
                    {pet.species}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
