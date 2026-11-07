import { redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  redirect(session.user.role === "admin" ? "/admin" : "/dashboard");
}
