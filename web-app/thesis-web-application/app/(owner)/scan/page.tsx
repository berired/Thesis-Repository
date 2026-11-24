import OwnerPage from "@/app/components/owner-page";
import ScanTag from "./scan-tag";

/**
 * Scan a QR code or tap an NFC tag from inside the app. Either one opens the same page the
 * printed link opens (/r/<code>): your own animal's page, a caretaker's view of it, the finder
 * page for a lost animal, or the registration form for a tag nobody has claimed yet.
 */
export default function ScanPage() {
  return (
    <OwnerPage crumbs={[{ label: "Scan a tag" }]}>
      <h1 className="font-display text-[34px] leading-[38px] text-forest">Scan a tag</h1>
      <p className="max-w-[560px] text-sm text-muted">
        Point the camera at a QR code, or tap an NFC tag. You&apos;ll land on the same page as if you
        had scanned it with your phone&apos;s own camera or NFC reader.
      </p>
      <ScanTag />
    </OwnerPage>
  );
}
