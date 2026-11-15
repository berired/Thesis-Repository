import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/app/lib/session";
import OwnerPage from "@/app/components/owner-page";
import SignOutButton from "@/app/components/sign-out-button";
import AccountForm from "./account-form";

export default async function AccountPage() {
  const session = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      address: true,
      showPhone: true,
      showAddress: true,
    },
  });

  return (
    <OwnerPage crumbs={[{ label: "My details" }]}>
      <h1 className="font-display text-[36px] leading-[40px] text-forest sm:text-[44px] sm:leading-[48px]">My details</h1>
      <AccountForm
        name={user.name}
        email={user.email}
        phone={user.phone ?? ""}
        address={user.address ?? ""}
        showPhone={user.showPhone}
        showAddress={user.showAddress}
      />
      {/* The top bar hides sign out on small screens, so it lives here too. */}
      <SignOutButton className="h-10 w-fit rounded-xl border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-[#f6f8fa] sm:hidden" />
    </OwnerPage>
  );
}
