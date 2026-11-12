import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";

export default async function AdminPage() {
  await requireAdmin();

  const [users, pets, qrCodes, unusedQrCodes] = await Promise.all([
    prisma.user.count(),
    prisma.pet.count(),
    prisma.qrCode.count(),
    prisma.qrCode.count({ where: { status: "UNUSED" } }),
  ]);

  const stats = [
    { label: "Users", value: users },
    { label: "Pets", value: pets },
    { label: "QR codes", value: qrCodes },
    { label: "Unused QR codes", value: unusedQrCodes },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border p-4">
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="text-3xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
