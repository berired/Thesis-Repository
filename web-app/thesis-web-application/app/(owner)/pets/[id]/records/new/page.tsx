import OwnerPage from "@/app/components/owner-page";
import RecordForm from "@/app/components/record-form";
import { getOwnedPet } from "@/app/lib/pet-data";

export default async function NewRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = await getOwnedPet(id);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <OwnerPage
      crumbs={[
        { label: "My animals", href: "/pets" },
        { label: pet.name, href: `/pets/${pet.id}` },
        { label: "Health records", href: `/pets/${pet.id}/records` },
        { label: "Add record" },
      ]}
    >
      <h1 className="font-display text-[34px] leading-[38px] text-forest">Add a health record</h1>
      <RecordForm pets={[{ id: pet.id, name: pet.name }]} defaultPetId={pet.id} today={today} />
    </OwnerPage>
  );
}
