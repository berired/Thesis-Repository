"use client";

import { BTN_PRIMARY } from "../../ui";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={BTN_PRIMARY}>
      Print
    </button>
  );
}
