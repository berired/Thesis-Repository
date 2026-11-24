import { fmtFull } from "@/app/lib/time";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import { getQrImageUrl } from "@/app/lib/storage";
import { qrUrlForCode } from "@/app/lib/qr";
import CreateQrForm from "./create-form";
import DeleteButton from "./delete-button";
import EditLabel from "./edit-label";
import WriteNfc from "./write-nfc";

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">QR codes</h1>
        <Link href="/admin/qr-codes/print" className="rounded border px-3 py-1.5 text-sm">
          Print layout
        </Link>
      </div>

      <CreateQrForm />

      <div className="overflow-x-auto"><table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b">
          <tr>
            <th className="py-2">Code</th>
            <th>Link</th>
            <th>Label</th>
            <th>Status</th>
            <th>Created</th>
            <th>Image</th>
            <th>NFC tag</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((qr) => (
            <tr key={qr.id} className="border-b">
              <td className="py-2 font-mono">{qr.code}</td>
              <td className="font-mono">{qrUrlForCode(qr.code)}</td>
              <td>
                <EditLabel id={qr.id} label={qr.batch} />
              </td>
              <td>{qr.status}</td>
              <td>{fmtFull(qr.createdAt)}</td>
              <td>
                {qr.imageUrl ? (
                  <a href={qr.imageUrl} target="_blank" className="underline">
                    PNG
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td className="max-w-[240px]">
                {qr.nfcWrittenAt ? (
                  <p className="mb-1 text-xs text-gray-600">
                    Written {fmtFull(qr.nfcWrittenAt)}
                    {qr.nfcSerial ? ` (chip ${qr.nfcSerial})` : ""}
                  </p>
                ) : null}
                {qr.status === "REVOKED" ? (
                  <span className="text-gray-500">-</span>
                ) : (
                  <WriteNfc id={qr.id} url={qrUrlForCode(qr.code)} />
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
              <td colSpan={8} className="py-4 text-gray-600">
                No QR codes yet.
              </td>
            </tr>
          )}
        </tbody>
      </table></div>
    </div>
  );
}
