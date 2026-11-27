import Link from "next/link";
import Icon, { type IconName } from "@/app/components/app-icon";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import { CARD, PageHeader } from "./ui";

export default async function AdminPage() {
  const session = await requireAdmin();

  const [users, pets, qrCodes, unusedQrCodes, recordReports, messageReports] = await Promise.all([
    prisma.user.count(),
    prisma.pet.count(),
    prisma.qrCode.count(),
    prisma.qrCode.count({ where: { status: "UNUSED" } }),
    prisma.recordReport.count({ where: { status: "OPEN" } }),
    prisma.threadReport.count({ where: { status: "OPEN" } }),
  ]);

  const stats: { label: string; value: number; icon: IconName; href: string; tone: string }[] = [
    { label: "Users", value: users, icon: "users", href: "/admin/users", tone: "bg-butter-soft text-butter-ink" },
    { label: "Pets", value: pets, icon: "paw-print", href: "/admin/pets", tone: "bg-blush-soft text-blush-ink" },
    { label: "QR codes", value: qrCodes, icon: "qr-code", href: "/admin/qr-codes", tone: "bg-[#e3f1fb] text-[#2a559e]" },
    { label: "Unused QR codes", value: unusedQrCodes, icon: "archive", href: "/admin/qr-codes/print", tone: "bg-lime-soft text-lime-ink" },
  ];

  const open = [
    { label: "Vet record reports", count: recordReports, href: "/admin/records?view=reports" },
    { label: "Reported conversations", count: messageReports, href: "/admin/messages" },
  ];
  const nothingOpen = recordReports + messageReports === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        description={`Signed in as ${session.user.name}. Everything on Pawket Book at a glance.`}
      />

      <ul className="stagger grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link
              href={stat.href}
              className={`${CARD} lift flex h-full flex-col gap-4 p-4 sm:p-5`}
            >
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${stat.tone}`}>
                <Icon name={stat.icon} size={20} />
              </span>
              <span className="flex flex-col">
                <span className="font-display text-[44px] leading-[44px] text-forest tabular-nums">
                  {stat.value}
                </span>
                <span className="mt-1 text-[13px] font-medium text-muted">{stat.label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-ink">Waiting on you</h2>
        {nothingOpen ? (
          <div className={`${CARD} flex items-center gap-3 p-5 text-sm text-muted`}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime-soft text-lime-ink">
              <Icon name="circle-check" size={20} />
            </span>
            Nothing to review. New reports will show up here and as a badge in the sidebar.
          </div>
        ) : (
          <ul className={`${CARD} divide-y divide-line overflow-hidden`}>
            {open.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-5 py-4 text-sm hover:bg-[#fbf8f1]"
                >
                  <span
                    className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[13px] font-semibold ${
                      item.count > 0 ? "bg-sky text-white" : "bg-[#eef1f4] text-muted"
                    }`}
                  >
                    {item.count}
                  </span>
                  <span className="flex-1 font-medium text-ink">{item.label}</span>
                  <Icon name="chevron-right" size={18} className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
