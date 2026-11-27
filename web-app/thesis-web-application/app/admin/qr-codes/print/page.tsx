import Link from "next/link";
import QRCode from "qrcode";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import { qrUrlForCode } from "@/app/lib/qr";
import { PageHeader } from "../../ui";
import PrintButton from "./print-button";

type Search = { label?: string; status?: string };

/** Printable sheet: each tag is the QR code with its short code underneath. */
export default async function QrPrintPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireAdmin();
  const { label, status } = await searchParams;
  const all = status === "all";

  const qrCodes = await prisma.qrCode.findMany({
    where: {
      ...(all ? { status: { not: "REVOKED" } } : { status: "UNUSED" }),
      ...(label ? { batch: label } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const tags = await Promise.all(
    qrCodes.map(async (qr) => ({
      id: qr.id,
      code: qr.code,
      svg: await QRCode.toString(qrUrlForCode(qr.code), {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "M",
      }),
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Print layout"
        back={{ href: "/admin/qr-codes", label: "Back to QR codes" }}
        description={`${tags.length} ${tags.length === 1 ? "tag" : "tags"}${label ? ` labelled "${label}"` : ""} · ${all ? "all codes" : "unused codes only"}`}
        actions={
          <>
            <Link
              href={{
                pathname: "/admin/qr-codes/print",
                query: { ...(label ? { label } : {}), ...(all ? {} : { status: "all" }) },
              }}
              className="inline-flex h-8 items-center rounded-lg border border-[#c3c9d1] bg-white px-3 text-[13px] font-semibold text-ink hover:bg-[#f6f8fa]"
            >
              {all ? "Show unused only" : "Include claimed"}
            </Link>
            <PrintButton />
          </>
        }
      />

      {tags.length === 0 ? (
        <p className="text-muted print:hidden">No QR codes to print.</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(45mm,1fr))] gap-3 print:gap-0">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex break-inside-avoid flex-col items-center gap-2 border border-dashed border-gray-400 bg-white p-3"
            >
              <div
                aria-label={`QR code ${tag.code}`}
                role="img"
                className="aspect-square w-full [&>svg]:size-full"
                dangerouslySetInnerHTML={{ __html: tag.svg }}
              />
              <p className="font-mono text-sm tracking-wider">{tag.code}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
