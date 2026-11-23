import { todayInput } from "@/app/lib/time";
import OwnerPage from "@/app/components/owner-page";
import RecordForm from "@/app/components/record-form";
import RecordDateForm from "@/app/components/record-date-form";
import { dateInput, getOwnedRecord, timeInput } from "@/app/lib/record-data";

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) {
  const { id, recordId } = await params;
  const { pet, record } = await getOwnedRecord(id, recordId);
  const today = todayInput();

  return (
    <OwnerPage
      crumbs={[
        { label: "My animals", href: "/pets" },
        { label: pet.name, href: `/pets/${pet.id}` },
        { label: "Health records", href: `/pets/${pet.id}/records` },
        { label: record.title, href: `/pets/${pet.id}/records/${record.id}` },
        { label: "Edit" },
      ]}
    >
      <h1 className="font-display text-[34px] leading-[38px] text-forest">
        {record.source === "VET" ? "Edit visit date" : "Edit record"}
      </h1>
      {record.source === "VET" ? (
        <RecordDateForm
          recordId={record.id}
          petId={pet.id}
          date={dateInput(record.recordDate)}
          today={today}
        />
      ) : (
        <RecordForm
          pets={[{ id: pet.id, name: pet.name }]}
          defaultPetId={pet.id}
          today={today}
          recordId={record.id}
          existingFiles={record.files}
          initial={{
            type: record.type,
            title: record.type === "WEIGHT" ? "" : record.title,
            recordDate: dateInput(record.recordDate),
            weightKg: record.weightKg?.toString() ?? "",
            clinic: record.clinic ?? "",
            notes: record.notes ?? "",
            dose: record.dose ?? "",
            batchNumber: record.batchNumber ?? "",
            endDate: dateInput(record.endDate),
            nextDueDate: dateInput(record.nextDueDate),
            doseTimes: [...new Set(record.reminders.map((r) => timeInput(r.dueAt)))].sort(),
          }}
        />
      )}
    </OwnerPage>
  );
}
