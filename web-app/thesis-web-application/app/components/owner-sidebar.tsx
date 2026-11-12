"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  icon: string;
  href?: string;
  /** Path prefix that highlights this item, for sections without their own page yet. */
  section?: string;
  badge?: number;
};

// Only Home has a page of its own so far; the rest are inert until built.
const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: "/icons/home.svg", href: "/dashboard" },
  { label: "My animals", icon: "/icons/paw-nav.svg", section: "/pets" },
  { label: "Health records", icon: "/icons/records.svg" },
  { label: "Reminders", icon: "/icons/bell-nav.svg" },
  { label: "Find a vet", icon: "/icons/map-pin-nav.svg" },
  { label: "Appointments", icon: "/icons/calendar.svg" },
  { label: "Messages", icon: "/icons/message.svg" },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export default function OwnerSidebar({
  userName,
  reminderCount = 0,
}: {
  userName: string;
  reminderCount?: number;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col gap-6 bg-forest px-3 py-5"
    >
      <div className="px-3 pb-[4.5px]">
        <Link
          href="/dashboard"
          className="font-display text-[26px] leading-[26px] tracking-[0.26px] text-butter"
        >
          Pawket Book
        </Link>
      </div>

      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.href
            ? pathname === item.href
            : item.section !== undefined && pathname.startsWith(item.section);
          const badge = item.label === "Reminders" ? reminderCount : item.badge;
          const base =
            "flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm";
          const state = active
            ? "bg-butter font-semibold text-ink"
            : "font-medium text-white";
          const content = (
            <>
              {/* The Figma icons are single-colour; Home is exported dark, so
                  flip it to white when it isn't the active item. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon}
                alt=""
                width={20}
                height={20}
                className={
                  !active && item.href === "/dashboard"
                    ? "brightness-0 invert"
                    : undefined
                }
              />
              <span className="flex-1 pb-px">{item.label}</span>
              {badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky px-1.5 text-[11px] font-semibold text-white">
                  {badge}
                </span>
              ) : null}
            </>
          );

          return (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`${base} ${state}`}
                >
                  {content}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className={`${base} ${state} cursor-default`}
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex h-11 items-center gap-3 px-3">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-butter-soft text-[11px] font-semibold text-butter-ink"
          >
            {initials(userName)}
          </span>
          <span className="truncate pb-px text-sm font-medium text-white">
            {userName}
          </span>
        </div>
      </div>
    </nav>
  );
}
