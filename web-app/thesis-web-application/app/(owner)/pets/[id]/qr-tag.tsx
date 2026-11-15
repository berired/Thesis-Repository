import QRCode from "qrcode";
import { qrUrlForCode } from "@/app/lib/qr";
import QrTagDialog from "./qr-tag-dialog";

export default async function QRTag({
    code,
    petName,
    className,
}: {
    code: string | null;
    petName: string;
    className: string;
}) {
    if (!code) {
        return (
            <span
                aria-disabled = "true"
                title = "No tag has been assigned for this pet yet. Please assign a tag first."
                className = {`${className} cursor-not-allowed select-none !text-[#a0a7b0]`}
                >
                QR Tag
                </span>
        );
    }

    const svg = await QRCode.toString(qrUrlForCode(code), {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "H",
    });

    return (
        <QrTagDialog
            svg = {svg}
            code = {code}
            url = {qrUrlForCode(code)}
            petName = {petName}
            className = {className}
            />
    );
}