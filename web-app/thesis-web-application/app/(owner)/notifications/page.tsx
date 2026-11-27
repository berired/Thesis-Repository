import Link from "next/link";
import OwnerPage from "@/app/components/owner-page";
import Icon, { type IconName } from "@/app/components/app-icon";
import { fmtDay, fmtTime, startOfToday } from "@/app/lib/care";
import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import { syncDueNotifications } from "@/app/lib/notifications";
import { markAllRead } from "./actions";
import type { NotificationType, Prisma } from "@/app/generated/prisma/client";

type Tab = "all" | "unread" | "appointments" | "reminders";

const TYPE_TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "appointments", label: "Appointments" },
  { key: "reminders", label: "Reminders" },
];

const REMINDER_TYPES: NotificationType[] = ["REMINDER_DUE", "REMINDER_OVERDUE", "REMINDER_SOON"];
const ICON: Record<NotificationType, IconName> = {
  REMINDER_DUE: "clock",
  REMINDER_OVERDUE: "circle-alert",
  REMINDER_SOON: "bell",
  APPOINTMENT_SOON: "calendar",
  VET_RECORD: "file-text",
  LOST_MESSAGE: "info",
  SHARE_INVITE: "users",
  CARETAKER_COMPLETED: "circle-check",
  CARE_TIPS: "pill",
};

function whenLabel(d: Date, now: Date) {
  if (startOfToday(d).getTime() === startOfToday(now).getTime()) return fmtTime(d);
  return fmtDay(d);
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireUser();
  const { tab: tabParam } = await searchParams;
  const tab = TYPE_TABS.find((t) => t.key === tabParam)?.key ?? "all";
  // The header bell creates these too, but it renders after this page has read the list.
  await syncDueNotifications(session.user.id);
  const now = new Date();

  const where: Prisma.NotificationWhereInput = {
    userId: session.user.id,
    ...(tab === "unread" ? { readAt: null } : {}),
    ...(tab === "appointments" ? { type: "APPOINTMENT_SOON" } : {}),
    ...(tab === "reminders" ? { type: { in: REMINDER_TYPES } } : {}),
  };
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
  ]);

  const today = startOfToday(now).getTime();
  const recent = items.filter((n) => n.createdAt.getTime() >= today);
  const earlier = items.filter((n) => n.createdAt.getTime() < today);

  const row = (n: (typeof items)[number]) => (
    <li key={n.id}>
      <Link
        href={`/notifications/${n.id}`}
        className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#fbfcfd] ${n.readAt ? "" : "bg-[#fff4cf]"}`}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eef3fb] text-sky">
          <Icon name={ICON[n.type]} size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{n.title}</span>
          {n.body ? <span className="block truncate text-[13px] text-muted">{n.body}</span> : null}
        </span>
        <span className="shrink-0 text-[13px] text-muted">{whenLabel(n.createdAt, now)}</span>
        {n.readAt ? null : (
          <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-sky" />
        )}
      </Link>
    </li>
  );

  return (
    <OwnerPage>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-[40px] leading-[44px] text-forest">Notifications</h1>
        {unread > 0 ? (
          <form action={markAllRead}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm font-semibold text-sky"
            >
              <Icon name="check-check" size={16} />
              Mark all as read
            </button>
          </form>
        ) : null}
      </div>

      <nav
        aria-label="Notification views"
        className="flex gap-1 overflow-x-auto border-b border-line"
      >
        {TYPE_TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "all" ? "/notifications" : `/notifications?tab=${t.key}`}
            aria-current={t.key === tab ? "page" : undefined}
            className={`-mb-px flex h-10 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium ${
              t.key === tab
                ? "border-sky text-[#2a559e]"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
            {t.key === "unread" && unread > 0 ? (
              <span className="rounded-full bg-[#eef0f3] px-1.5 text-xs">{unread}</span>
            ) : null}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#c3c9d1] bg-white p-8 text-[15px] text-muted">
          {tab === "unread"
            ? "You're all caught up."
            : "No notifications yet. Due reminders and upcoming visits show up here."}
        </p>
      ) : (
        <div className="flex max-w-[760px] flex-col gap-5">
          {recent.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-[13px] font-semibold text-muted">Today</h2>
              <ul className="stagger divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                {recent.map(row)}
              </ul>
            </section>
          ) : null}
          {earlier.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-[13px] font-semibold text-muted">Earlier</h2>
              <ul className="stagger divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                {earlier.map(row)}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </OwnerPage>
  );
}
