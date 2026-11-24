import Link from "next/link";
import OwnerPage from "@/app/components/owner-page";
import Icon from "@/app/components/app-icon";
import { PetAvatar, petPhotoSrc } from "@/app/components/pet-avatar";
import { RECORD_LABEL, fmtDay, fmtFull } from "@/app/lib/care";
import { accessiblePets, visibleReminders } from "@/app/lib/pet-access";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";

const LIMIT = 20;
const MIN_LENGTH = 2;

const contains = (field: string, q: string) => ({ [field]: { contains: q, mode: "insensitive" as const } });

/**
 * Searches the signed-in user's own animals, records and reminders. Every query starts from
 * the access helpers, so someone only ever finds animals they own or care for, and a caretaker
 * only finds the reminders given to them.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireUser();
  const userId = session.user.id;
  const { q: raw } = await searchParams;
  const q = (raw ?? "").trim().slice(0, 80);
  const searching = q.length >= MIN_LENGTH;
  const activePets = { ...accessiblePets(userId), archivedAt: null };

  const [pets, records, reminders] = searching
    ? await Promise.all([
        prisma.pet.findMany({
          where: {
            AND: [
              activePets,
              {
                OR: [
                  contains("name", q),
                  contains("breed", q),
                  contains("species", q),
                  contains("microchip", q),
                  contains("color", q),
                ],
              },
            ],
          },
          orderBy: { name: "asc" },
          take: LIMIT,
          select: { id: true, name: true, species: true, breed: true, photoKey: true, updatedAt: true },
        }),
        prisma.healthRecord.findMany({
          where: {
            voidedAt: null,
            pet: activePets,
            OR: [contains("title", q), contains("clinic", q), contains("vetName", q), contains("notes", q)],
          },
          orderBy: { recordDate: "desc" },
          take: LIMIT,
          select: {
            id: true,
            petId: true,
            title: true,
            type: true,
            recordDate: true,
            clinic: true,
            pet: { select: { name: true } },
          },
        }),
        prisma.reminder.findMany({
          where: {
            completedAt: null,
            pet: activePets,
            AND: [visibleReminders(userId), { OR: [contains("title", q), contains("place", q)] }],
          },
          orderBy: { dueAt: "asc" },
          take: LIMIT,
          select: { id: true, petId: true, title: true, dueAt: true, pet: { select: { name: true } } },
        }),
      ])
    : [[], [], []];

  const total = pets.length + records.length + reminders.length;
  const row = "flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 hover:bg-[#f6f8fa]";

  return (
    <OwnerPage crumbs={[{ label: "Search" }]}>
      <h1 className="font-display text-[34px] leading-[38px] text-forest">
        {q ? `Search: ${q}` : "Search"}
      </h1>

      {!searching ? (
        <p className="max-w-[560px] text-sm text-muted">
          Type at least {MIN_LENGTH} letters in the search box above to find your animals, their
          health records and reminders.
        </p>
      ) : total === 0 ? (
        <p className="max-w-[560px] rounded-xl border border-dashed border-[#c3c9d1] bg-white p-6 text-sm text-muted">
          Nothing matches &ldquo;{q}&rdquo;. Try a name, a record title, a vet or a reminder.
        </p>
      ) : (
        <div className="flex max-w-[720px] flex-col gap-6">
          {pets.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-muted">Animals ({pets.length})</h2>
              <ul className="stagger flex flex-col gap-2">
                {pets.map((p) => (
                  <li key={p.id}>
                    <Link href={`/pets/${p.id}`} className={row}>
                      <PetAvatar name={p.name} species={p.species} size={36} photoSrc={petPhotoSrc(p)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{p.name}</span>
                        <span className="block truncate text-[13px] text-muted">
                          {[p.species, p.breed].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {records.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-muted">Health records ({records.length})</h2>
              <ul className="stagger flex flex-col gap-2">
                {records.map((r) => (
                  <li key={r.id}>
                    <Link href={`/pets/${r.petId}/records/${r.id}`} className={row}>
                      <Icon name="file-text" size={18} className="shrink-0 text-sky" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{r.title}</span>
                        <span className="block truncate text-[13px] text-muted">
                          {r.pet.name} · {RECORD_LABEL[r.type]} · {fmtFull(r.recordDate)}
                          {r.clinic ? ` · ${r.clinic}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {reminders.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-muted">Reminders ({reminders.length})</h2>
              <ul className="stagger flex flex-col gap-2">
                {reminders.map((r) => (
                  <li key={r.id}>
                    <Link href={`/pets/${r.petId}/reminders`} className={row}>
                      <Icon name="bell" size={18} className="shrink-0 text-sky" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{r.title}</span>
                        <span className="block truncate text-[13px] text-muted">
                          {r.pet.name} · {fmtDay(r.dueAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </OwnerPage>
  );
}
