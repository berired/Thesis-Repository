"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded border bg-black px-3 py-1.5 text-sm text-white"
    >
      Print
    </button>
  );
}
