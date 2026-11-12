import OwnerPage from "@/app/components/owner-page";
import FormWithError from "@/app/components/form-with-error";
import { Field, INPUT_CLASS } from "@/app/components/ui";
import { getOwnedPet } from "@/app/lib/pet-data";
import { createAppointment } from "@/app/(owner)/actions";

export default async function NewAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = await getOwnedPet(id);

  return (
    <OwnerPage
      crumbs={[
        { label: "My animals", href: "/dashboard" },
        { label: pet.name, href: `/pets/${pet.id}` },
        { label: "Appointments", href: `/pets/${pet.id}/appointments` },
        { label: "Book appointment" },
      ]}
    >
      <div className="max-w-[520px] rounded-xl border border-line bg-white p-6">
        <h1 className="mb-4 font-display text-[30px] leading-[33px] text-forest">
          Book a visit for {pet.name}
        </h1>
        <FormWithError
          action={createAppointment.bind(null, pet.id)}
          submitLabel="Book appointment"
          pendingLabel="Booking..."
          cancelHref={`/pets/${pet.id}/appointments`}
        >
          <Field label="Reason for visit" hint="e.g. Annual check-up, Vaccination">
            <input name="title" type="text" required maxLength={120} className={INPUT_CLASS} />
          </Field>
          <Field label="Clinic">
            <input
              name="clinicName"
              type="text"
              required
              maxLength={120}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Date and time">
            <input name="scheduledAt" type="datetime-local" required className={INPUT_CLASS} />
          </Field>
        </FormWithError>
      </div>
    </OwnerPage>
  );
}
