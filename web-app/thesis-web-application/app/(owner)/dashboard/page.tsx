import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import { formatAge } from "@/app/lib/pets";

export default async function DashboardPage() {
  const session = await requireUser();

  const pets = await prisma.pet.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  if (pets.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-3xl font-semibold">Welcome, {session.user.name}</h1>
        <p className="text-gray-600">
          You haven&apos;t registered any pets yet.
        </p>
        <Link
          href="/pets/new"
          className="rounded bg-black px-5 py-3 text-white"
        >
          Register a pet
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My pets</h1>
        <Link href="/pets/new" className="rounded bg-black px-3 py-2 text-sm text-white">
          Register a pet
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {pets.map((pet) => (
          <Link
            key={pet.id}
            href={`/pets/${pet.id}`}
            className="rounded border p-4 hover:bg-gray-50"
          >
            <p className="text-lg font-semibold">{pet.name}</p>
            <p className="text-sm text-gray-600">
              {pet.species}
              {pet.breed ? ` · ${pet.breed}` : ""} ·{" "}
              {formatAge(pet.birthDate, pet.birthDateApproximate)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
