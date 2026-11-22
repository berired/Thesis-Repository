import { notFound } from "next/navigation";
import OwnerPage from "@/app/components/owner-page";
import RecordForm from "@/app/components/record-form";
import { prisma } from "@/app/lib/prisma";
import { accessiblePets } from "@/app/lib/pet-access";
import { requireUser } from "@/app/lib/session";

// Add a record from the all-animals page: the animal is picked in the form.
export default async function NewRecordAnyPetPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const session = await requireUser();
  const { pet: petParam } = await searchParams;
  const pets = await prisma.pet.findMany({
    where: { ...accessiblePets(session.user.id), archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  if (pets.length === 0) notFound();
  const defaultPetId = pets.find((p) => p.id === petParam)?.id ?? pets[0].id;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <OwnerPage crumbs={[{ label: "Health records", href: "/records" }, { label: "Add record" }]}>
      <h1 className="font-display text-[34px] leading-[38px] text-forest">Add a health record</h1>
      <RecordForm pets={pets} defaultPetId={defaultPetId} today={today} />
    </OwnerPage>
  );
}
