import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

/** Get the current session, or null if signed out. */
export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/** Require any signed-in user. Redirects to /login if not signed in. */
export async function requireUser(): Promise<Session["user"]> {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/** Require an ADMIN user. Redirects non-admins away. */
export async function requireAdmin(): Promise<Session["user"]> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/account");
  }
  return user;
}
