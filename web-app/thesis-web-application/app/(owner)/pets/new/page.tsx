import { extractCode } from "@/app/lib/claim-pet";
import PetForm from "./pet-form";

export default async function NewPetPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return <PetForm initialCode={code ? extractCode(code) : ""} />;
}
