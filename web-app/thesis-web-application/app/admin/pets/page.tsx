import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";

export default async function PetsPage() {
  await requireAdmin();

  const pets = await prisma.pet.findMany({
    include: { owner: true, qrCode: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Pets</h1>

      <table className="w-full text-left text-sm">
        <thead className="border-b">
          <tr>
            <th className="py-2">Name</th>
            <th>Species</th>
            <th>Owner</th>
            <th>QR code</th>
            <th>Registered</th>
          </tr>
        </thead>
        <tbody>
          {pets.map((pet) => (
            <tr key={pet.id} className="border-b">
              <td className="py-2">{pet.name}</td>
              <td>{pet.species}</td>
              <td>
                {pet.owner.name} ({pet.owner.email})
              </td>
              <td className="font-mono">{pet.qrCode?.code ?? "-"}</td>
              <td>{pet.createdAt.toLocaleDateString()}</td>
            </tr>
          ))}
          {pets.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-gray-600">
                No pets registered yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
