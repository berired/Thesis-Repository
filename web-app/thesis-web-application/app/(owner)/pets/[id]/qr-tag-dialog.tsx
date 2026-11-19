"use client";

import { useRef } from "react";
import Icon from "@/app/components/app-icon";

export default function QrTagDialog({
    svg,
    code,
    url,
    petName,
    className,
}: {
    svg: string;
    code: string;
    url: string;
    petName: string;
    className: string;
}) {
    const ref = useRef<HTMLDialogElement>(null);

    return (
        <>
        <button type = "button" onClick = {() => ref.current?.showModal()} className = {className}>
            <Icon name = "qr-code" size={16} />
            QR Tag
        </button>

        <dialog
            ref = {ref}
            onClick = {(e) => {
                if (e.target === ref.current) ref.current?.close();
            }}
            className="m-auto w-[min(380px,calc(100vw-32px))] rounded-[20px] border-2 border-ink bg-white p-0 text-ink shadow-[8px_8px_0_var(--color-butter)] backdrop:bg-black/40"
            >
                <div className = "flex flex-col items-center gap-4 px-7 py-7">
                    <h2 className = "font-display text-[28px] leading-[30px] text-forrest">
                        {petName}&apos;s QR Tag
                    </h2>
                    <div
                        role = "img"
                        aria-label = {`QR code ${code}`}
                        className = "size-[220px] rounded-xl border border-line bg-white p-3 [&>svg]:size-full"
                        dangerouslySetInnerHTML = {{ __html: svg }}
                    />
                    <div className = "text-center">
                        <p className = "font-mono text-lg tracking-wider">{code}</p>
                        <p className = "mt-1 break-all text-xs text-muted">{url}</p>
                    </div>
                    <button
                        type = "button"
                        onClick = {() => ref.current?.close()}
                        className = "h-10 rounded-xl border border-[#c3c9d1] bg-white px-[18px] text-[15px] font-semibold hover:bg-[#f6fafa]"
                    >
                        Close
                    </button>
                </div>
            </dialog>
        </>
    );
}