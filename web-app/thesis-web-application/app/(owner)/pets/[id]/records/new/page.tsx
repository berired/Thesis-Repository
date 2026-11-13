import OwnerPage from "@/app/components/owner-page";
import FormWithError from "@/app/components/form-with-error";
import { getOwnedPet } from "@/app/lib/pet-data";
import { createRecord } from "@/app/(owner)/actions";
import RecordFields from "./record-fields";

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
      <div className="max-w-[520px] rounded-xl border border-line bg-white p-6">
        <h1 className="mb-4 font-display text-[30px] leading-[33px] text-forest">
          Add a record for {pet.name}
        </h1>
        <FormWithError
          action={createRecord.bind(null, pet.id)}
          submitLabel="Save record"
          pendingLabel="Saving..."
          cancelHref={`/pets/${pet.id}/records`}
        >
          <RecordFields today={today} />
        </FormWithError>
      </div>
    </OwnerPage>
  );
}
