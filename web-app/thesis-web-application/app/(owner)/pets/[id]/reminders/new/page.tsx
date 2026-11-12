import OwnerPage from "@/app/components/owner-page";
import FormWithError from "@/app/components/form-with-error";
import { Field, INPUT_CLASS } from "@/app/components/ui";
import { getOwnedPet } from "@/app/lib/pet-data";
import { CATEGORY_LABEL, REPEAT_LABEL } from "@/app/lib/care";
import { createReminder } from "@/app/(owner)/actions";

export default async function NewReminderPage({
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
        { label: "Add reminder" },
      ]}
    >
      <div className="max-w-[520px] rounded-xl border border-line bg-white p-6">
        <h1 className="mb-4 font-display text-[30px] leading-[33px] text-forest">
          Set a reminder for {pet.name}
        </h1>
        <FormWithError
          action={createReminder.bind(null, pet.id)}
          submitLabel="Save reminder"
          pendingLabel="Saving..."
          cancelHref={`/pets/${pet.id}`}
        >
          <Field label="What needs doing?" hint="e.g. Deworming tablet, Change tank water">
            <input name="title" type="text" required maxLength={120} className={INPUT_CLASS} />
          </Field>
          <Field label="Category">
            <select name="category" defaultValue="CARE" className={INPUT_CLASS}>
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due">
            <input name="dueAt" type="datetime-local" required className={INPUT_CLASS} />
          </Field>
          <Field label="Repeats">
            <select name="repeat" defaultValue="NONE" className={INPUT_CLASS}>
              {Object.entries(REPEAT_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </FormWithError>
      </div>
    </OwnerPage>
  );
}
