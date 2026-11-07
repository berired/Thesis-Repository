import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/session";
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
      <h1 className="text-2xl font-semibold">Users</h1>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search name or email"
          className="w-72 rounded border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded border px-3 py-2 text-sm">
          Search
        </button>
      </form>

      <table className="w-full text-left text-sm">
        <thead className="border-b">
          <tr>
            <th className="py-2">Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === session.user.id;
            const isAdmin = user.role === "admin";
            return (
              <tr key={user.id} className="border-b">
                <td className="py-2">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role ?? "user"}</td>
                <td>{user.banned ? "Banned" : "Active"}</td>
                <td>{user.createdAt.toLocaleDateString()}</td>
                <td>
                  {isSelf ? (
                    <span className="text-gray-500">You</span>
                  ) : (
                    <div className="flex gap-2">
                      <form action={setUserRole}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input
                          type="hidden"
                          name="role"
                          value={isAdmin ? "user" : "admin"}
                        />
                        <button className="rounded border px-2 py-1">
                          {isAdmin ? "Remove admin" : "Make admin"}
                        </button>
                      </form>
                      <form action={user.banned ? unbanUser : banUser}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button className="rounded border px-2 py-1">
                          {user.banned ? "Unban" : "Ban"}
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-gray-600">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
