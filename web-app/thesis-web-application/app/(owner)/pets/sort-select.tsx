"use client";

import { useRouter } from "next/navigation";
import Icon from "@/app/components/icon";

export const SORTS = [
  { value: "due", label: "Next due first" },
  { value: "name", label: "Name" },
  { value: "newest", label: "Newest first" },
] as const;

/** Navigates to the same page with a new sort; `hrefs` are prebuilt per option. */
export default function SortSelect({
  value,
  hrefs,
}: {
  value: string;
  hrefs: Record<string, string>;
}) {
  const router = useRouter();
  return (
    <span className="relative">
      <select
        aria-label="Sort animals"
        value={value}
        onChange={(e) => router.push(hrefs[e.target.value])}
        className="h-9 appearance-none rounded-lg border border-line bg-white pl-3 pr-9 text-[13px] text-ink focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        size={14}
        className="pointer-events-none absolute right-3 top-[11px] text-muted"
      />
    </span>
  );
}
