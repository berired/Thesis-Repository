"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Icon from "@/app/components/icon";

export default function YearSelect({
  years,
  current,
}: {
  years: number[];
  current?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="relative">
      <span className="sr-only">Filter by year</span>
      <select
        value={current ?? ""}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value) next.set("year", e.target.value);
          else next.delete("year");
          const qs = next.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname);
        }}
        className="h-9 appearance-none rounded-lg border border-line bg-white pl-3.5 pr-9 text-[13px] font-medium text-ink"
      >
        <option value="">All years</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </label>
  );
}
