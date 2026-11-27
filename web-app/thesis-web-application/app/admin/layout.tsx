import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import AdminSidebar from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  // Things waiting on an admin, shown as badges beside the sections that hold them.
  const [recordReports, messageReports] = await Promise.all([
    prisma.recordReport.count({ where: { status: "OPEN" } }),
    prisma.threadReport.count({ where: { status: "OPEN" } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink lg:flex-row print:bg-white">
      <AdminSidebar
        userName={session.user.name}
        email={session.user.email}
        badges={{ "Vet records": recordReports, Messages: messageReports }}
      />
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-5 sm:px-8 sm:py-7 print:p-0">
        {children}
      </main>
    </div>
  );
}
