import { extractCode } from "@/app/lib/claim-pet";
import OwnerPage from "@/app/components/owner-page";
import PetForm from "./pet-form";

export default async function NewPetPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <OwnerPage crumbs={[{ label: "My animals", href: "/dashboard" }, { label: "Add animal" }]}>
      <h1 className="font-display text-[30px] leading-[33px] text-forest">Register an animal</h1>
      <PetForm initialCode={code ? extractCode(code) : ""} />
    </OwnerPage>
  );
}
