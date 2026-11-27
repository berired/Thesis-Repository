import { fmtFull } from "@/app/lib/time";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import { EmptyRow, MONO, PageHeader, ROW, TD, TH, THead, TableCard } from "../ui";

export default async function PetsPage() {
  await requireAdmin();

  const pets = await prisma.pet.findMany({
    include: { owner: true, qrCode: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Pets" description="Every registered animal and the tag it is linked to." />

      <TableCard>
        <THead>
          <TH>Name</TH>
          <TH>Species</TH>
          <TH>Owner</TH>
          <TH>QR code</TH>
          <TH>Registered</TH>
        </THead>
        <tbody>
          {pets.map((pet) => (
            <tr key={pet.id} className={ROW}>
              <td className={`${TD} font-medium`}>{pet.name}</td>
              <td className={TD}>{pet.species}</td>
              <td className={TD}>
                {pet.owner.name}
                <span className="block text-[13px] text-muted">{pet.owner.email}</span>
              </td>
              <td className={`${TD} ${MONO}`}>{pet.qrCode?.code ?? "-"}</td>
              <td className={`${TD} whitespace-nowrap text-muted`}>{fmtFull(pet.createdAt)}</td>
            </tr>
          ))}
          {pets.length === 0 && <EmptyRow cols={5}>No pets registered yet.</EmptyRow>}
        </tbody>
      </TableCard>
    </div>
  );
}
