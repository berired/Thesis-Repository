import Link from "next/link";
import QRCode from "qrcode";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import { qrUrlForCode } from "@/app/lib/qr";
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
      <div className="flex flex-wrap items-center gap-4 print:hidden">
        <Link href="/admin/qr-codes" className="text-sm underline">
          Back to QR codes
        </Link>
        <h1 className="text-2xl font-semibold">Print layout</h1>
        <span className="text-sm text-gray-600">
          {tags.length} {tags.length === 1 ? "tag" : "tags"}
          {label ? ` labelled "${label}"` : ""} · {all ? "all codes" : "unused codes only"}
        </span>
        <Link
          href={{
            pathname: "/admin/qr-codes/print",
            query: { ...(label ? { label } : {}), ...(all ? {} : { status: "all" }) },
          }}
          className="text-sm underline"
        >
          {all ? "Show unused only" : "Include claimed"}
        </Link>
        <div className="ml-auto">
          <PrintButton />
        </div>
      </div>

      {tags.length === 0 ? (
        <p className="text-gray-600 print:hidden">No QR codes to print.</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(45mm,1fr))] gap-3 print:gap-0">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex break-inside-avoid flex-col items-center gap-2 border border-dashed border-gray-400 p-3"
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
