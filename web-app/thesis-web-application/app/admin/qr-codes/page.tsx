import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import { getQrImageUrl } from "@/app/lib/storage";
import { qrUrlForCode } from "@/app/lib/qr";
import CreateQrForm from "./create-form";
import DeleteButton from "./delete-button";

export default async function QrCodesPage() {
  await requireAdmin();

  const qrCodes = await prisma.qrCode.findMany({
    include: { pet: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const rows = await Promise.all(
    qrCodes.map(async (qr) => ({
      ...qr,
      imageUrl: qr.imageKey ? await getQrImageUrl(qr.imageKey) : null,
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">QR codes</h1>

      <CreateQrForm />

      <table className="w-full text-left text-sm">
        <thead className="border-b">
          <tr>
            <th className="py-2">Code</th>
            <th>Link</th>
            <th>Batch</th>
            <th>Status</th>
            <th>Created</th>
            <th>Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((qr) => (
            <tr key={qr.id} className="border-b">
              <td className="py-2 font-mono">{qr.code}</td>
              <td className="font-mono">{qrUrlForCode(qr.code)}</td>
              <td>{qr.batch ?? "-"}</td>
              <td>{qr.status}</td>
              <td>{qr.createdAt.toLocaleDateString()}</td>
              <td>
                {qr.imageUrl ? (
                  <a href={qr.imageUrl} target="_blank" className="underline">
                    PNG
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td>
                {qr.pet ? (
                  <span className="text-gray-500">In use</span>
                ) : (
                  <DeleteButton id={qr.id} code={qr.code} />
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-4 text-gray-600">
                No QR codes yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
