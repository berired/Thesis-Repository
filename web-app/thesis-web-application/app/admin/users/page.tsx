import { fmtFull } from "@/app/lib/time";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
import {
  BTN_DANGER,
  BTN_OUTLINE,
  BTN_PRIMARY,
  EmptyRow,
  FIELD,
  PageHeader,
  Pill,
  ROW,
  TD,
  TH,
  THead,
  TableCard,
} from "../ui";
import { banUser, setUserRole, unbanUser } from "./actions";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireAdmin();
  const { q } = await searchParams;
  const query = q?.trim();

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description={
          query
            ? `${users.length} ${users.length === 1 ? "match" : "matches"} for "${query}".`
            : "Everyone with a Pawket Book account. Newest first."
        }
      />

      <form role="search" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search name or email"
          aria-label="Search name or email"
          className={`${FIELD} max-w-80`}
        />
        <button type="submit" className={`${BTN_PRIMARY} !h-9 !px-4`}>
          Search
        </button>
      </form>

      <TableCard>
        <THead>
          <TH>Name</TH>
          <TH>Email</TH>
          <TH>Role</TH>
          <TH>Status</TH>
          <TH>Joined</TH>
          <TH>Actions</TH>
        </THead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === session.user.id;
            const isAdmin = user.role === "admin";
            return (
              <tr key={user.id} className={ROW}>
                <td className={`${TD} font-medium`}>{user.name}</td>
                <td className={`${TD} text-muted`}>{user.email}</td>
                <td className={TD}>
                  <Pill tone={isAdmin ? "yellow" : "gray"}>{isAdmin ? "Admin" : "User"}</Pill>
                </td>
                <td className={TD}>
                  <Pill tone={user.banned ? "pink" : "green"}>
                    {user.banned ? "Banned" : "Active"}
                  </Pill>
                </td>
                <td className={`${TD} whitespace-nowrap text-muted`}>{fmtFull(user.createdAt)}</td>
                <td className={TD}>
                  {isSelf ? (
                    <span className="text-muted">You</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <form action={setUserRole}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value={isAdmin ? "user" : "admin"} />
                        <button className={BTN_OUTLINE}>
                          {isAdmin ? "Remove admin" : "Make admin"}
                        </button>
                      </form>
                      <form action={user.banned ? unbanUser : banUser}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button className={user.banned ? BTN_OUTLINE : BTN_DANGER}>
                          {user.banned ? "Unban" : "Ban"}
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {users.length === 0 && <EmptyRow cols={6}>No users found.</EmptyRow>}
        </tbody>
      </TableCard>
    </div>
  );
}
