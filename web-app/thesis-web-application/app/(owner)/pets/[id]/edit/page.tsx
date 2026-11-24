import { requireUser } from "@/app/lib/session";
import { getOwnedPet } from "@/app/lib/pet-data";
import EditPetForm from "./edit-form";
import CaretakerList from "../../../sharing/caretaker-list";

export default async function EditPetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pet, session] = await Promise.all([getOwnedPet(id), requireUser()]);

  return (
    <EditPetForm
      pet={{
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed ?? "",
        sex: pet.sex,
        birthDate: pet.birthDate.toISOString().slice(0, 10),
        weightKg: pet.weightKg !== null ? String(pet.weightKg) : "",
        color: pet.color,
        microchip: pet.microchip ?? "",
        allergies: pet.allergies ?? "",
        hasPhoto: pet.photoKey !== null,
        version: pet.updatedAt.getTime(),
        recordCount: pet._count.records,
      }}
      ownerName={session.user.name}
      caretakers={<CaretakerList petId={pet.id} petName={pet.name} />}
    />
  );
}
