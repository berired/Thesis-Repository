import { prisma } from "@/app/lib/prisma";

// Lets the sign-up form tell people their email is already registered before
// they submit. Better Auth still rejects duplicates on sign-up itself.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || email.length > 254) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return Response.json({ exists: !!user });
}
