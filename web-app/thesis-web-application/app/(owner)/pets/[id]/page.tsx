import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import { formatAge } from "@/app/lib/pets";

export default async function PetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  const { tab } = await searchParams;

  // Always scoped to the owner: other people's pet ids look like 404s.
  const pet = await prisma.pet.findFirst({
    where: { id, ownerId: session.user.id },
    include: { documents: { orderBy: { uploadedAt: "desc" } } },
  });
  if (!pet) notFound();

  const active = tab === "records" ? "records" : "details";
  const tabClass = (t: string) =>
    `border-b-2 px-3 py-2 text-sm ${
      active === t ? "border-black font-semibold" : "border-transparent text-gray-600"
    }`;

  const rows: [string, string | null][] = [
    ["Species", pet.species],
    ["Breed", pet.breed],
    ["Sex", pet.sex === "MALE" ? "Male" : "Female"],
    ["Color", pet.color],
    ["Age", formatAge(pet.birthDate, pet.birthDateApproximate)],
    [
      pet.birthDateApproximate ? "Birth date (estimated)" : "Birth date",
      pet.birthDate.toISOString().slice(0, 10),
    ],
    ["Spayed / neutered", pet.neutered === null ? null : pet.neutered ? "Yes" : "No"],
    ["Weight", pet.weightKg !== null ? `${pet.weightKg} kg` : null],
    ["Microchip", pet.microchip],
    ["Markings", pet.markings],
    ["Medical notes", pet.medicalNotes],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard" className="text-sm underline">
          ← My pets
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{pet.name}</h1>
      </div>

      <nav className="flex gap-2 border-b">
        <Link href={`/pets/${pet.id}`} className={tabClass("details")}>
          Details
        </Link>
        <Link href={`/pets/${pet.id}?tab=records`} className={tabClass("records")}>
          Records
        </Link>
      </nav>

      {active === "details" ? (
        <dl className="grid gap-3 sm:grid-cols-[12rem_1fr]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-sm text-gray-600">{k}</dt>
              <dd>{v ?? "—"}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-gray-600">
          {pet.documents.length === 0
            ? "No records yet. Uploading documents is coming next."
            : `${pet.documents.length} record(s).`}
        </p>
      )}
    </div>
  );
}
