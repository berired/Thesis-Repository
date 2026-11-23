import { redirect } from "next/navigation";
import { getOwnedPet } from "@/app/lib/pet-data";

export default async function NewPetReminderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = await getOwnedPet(id);
  redirect(`/reminders/new?pet=${pet.id}&next=${encodeURIComponent(`/pets/${pet.id}/reminders`)}`);
}
