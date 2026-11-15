import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { safeNext } from "./safe-next";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.role !== "admin") redirect("/");
  return session;
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

/** For sign-in and sign-up: someone already signed in has no reason to see them. */
export async function redirectIfSignedIn(next?: string | null) {
  const session = await getSession();
  if (!session) return;
  redirect(next ? safeNext(next) : session.user.role === "admin" ? "/admin" : "/dashboard");
}
