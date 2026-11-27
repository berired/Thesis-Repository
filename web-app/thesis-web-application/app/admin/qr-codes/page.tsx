import { fmtFull } from "@/app/lib/time";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import { getQrImageUrl } from "@/app/lib/storage";
import { qrUrlForCode } from "@/app/lib/qr";
import {
  BTN_OUTLINE,
  EmptyRow,
  MONO,
  PageHeader,
  Pill,
  ROW,
  TD,
  TH,
  THead,
  TableCard,
} from "../ui";
import CreateQrForm from "./create-form";
import DeleteButton from "./delete-button";
import EditLabel from "./edit-label";
import WriteNfc from "./write-nfc";

const STATUS_TONE = { UNUSED: "blue", CLAIMED: "green", REVOKED: "pink" } as const;
const STATUS_LABEL = { UNUSED: "Unused", CLAIMED: "Claimed", REVOKED: "Revoked" } as const;

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
      <PageHeader
        title="QR codes"
        description="Generate tags, print them, and write their links to NFC chips."
        actions={
          <Link href="/admin/qr-codes/print" className={BTN_OUTLINE}>
            Print layout
          </Link>
        }
      />

      <CreateQrForm />

      <TableCard minWidth="72rem">
        <THead>
          <TH>Code</TH>
          <TH>Link</TH>
          <TH>Label</TH>
          <TH>Status</TH>
          <TH>Created</TH>
          <TH>Image</TH>
          <TH>NFC tag</TH>
          <TH>Actions</TH>
        </THead>
        <tbody>
          {rows.map((qr) => (
            <tr key={qr.id} className={ROW}>
              <td className={`${TD} ${MONO} font-medium`}>{qr.code}</td>
              <td className={`${TD} ${MONO} text-muted`}>{qrUrlForCode(qr.code)}</td>
              <td className={TD}>
                <EditLabel id={qr.id} label={qr.batch} />
              </td>
              <td className={TD}>
                <Pill tone={STATUS_TONE[qr.status]}>{STATUS_LABEL[qr.status]}</Pill>
              </td>
              <td className={`${TD} whitespace-nowrap text-muted`}>{fmtFull(qr.createdAt)}</td>
              <td className={TD}>
                {qr.imageUrl ? (
                  <a
                    href={qr.imageUrl}
                    target="_blank"
                    className="font-medium text-sky hover:underline"
                  >
                    PNG
                  </a>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td className={`${TD} min-w-[280px]`}>
                {qr.nfcWrittenAt ? (
                  <p className="mb-1.5 text-xs text-muted">
                    Written {fmtFull(qr.nfcWrittenAt)}
                    {qr.nfcSerial ? ` (chip ${qr.nfcSerial})` : ""}
                  </p>
                ) : null}
                {qr.status === "REVOKED" ? (
                  <span className="text-muted">-</span>
                ) : (
                  <WriteNfc id={qr.id} url={qrUrlForCode(qr.code)} />
                )}
              </td>
              <td className={TD}>
                {qr.pet ? (
                  <span className="text-muted">In use</span>
                ) : (
                  <DeleteButton id={qr.id} code={qr.code} />
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <EmptyRow cols={8}>No QR codes yet.</EmptyRow>}
        </tbody>
      </TableCard>
    </div>
  );
}
