import Link from "next/link";
import OwnerPage from "@/app/components/owner-page";
import ReminderForm from "@/app/components/reminder-form";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import { ownedPets } from "@/app/lib/pet-access";

export default async function NewReminderPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string; next?: string }>;
}) {
  const session = await requireUser();
  const { pet, next } = await searchParams;
  const pets = await prisma.pet.findMany({
    where: { ...ownedPets(session.user.id), archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const defaultPetId = pets.find((p) => p.id === pet)?.id ?? pets[0]?.id ?? "";
  const back = next && /^\/(?!\/)/.test(next) ? next : "/reminders";

  return (
    <OwnerPage crumbs={[{ label: "Reminders", href: "/reminders" }, { label: "New reminder" }]}>
      <h1 className="font-display text-[34px] leading-[38px] text-forest">New reminder</h1>
      {pets.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[#c3c9d1] bg-white p-8">
          <p className="text-[15px] text-muted">Add an animal before setting a reminder.</p>
          <Link href="/pets/new" className="text-sm font-semibold text-sky">
            + Add an animal
          </Link>
        </div>
      ) : (
        <ReminderForm
          pets={pets}
          defaultPetId={defaultPetId}
          today={new Date().toISOString().slice(0, 10)}
          next={back}
        />
      )}
    </OwnerPage>
  );
}
