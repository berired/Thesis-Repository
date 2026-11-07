import { extractCode } from "@/app/lib/claim-pet";
import PetForm from "./pet-form";

export default async function NewPetPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Register a pet</h1>
      <PetForm initialCode={code ? extractCode(code) : ""} />
    </div>
  );
}
