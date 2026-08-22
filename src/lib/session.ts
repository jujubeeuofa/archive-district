import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Role } from "@/lib/enums";
import { isStaff } from "@/lib/permissions";
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

/**
 * Require staff — ADMIN or SALES. This is the guard almost every /admin
 * page and server action should use; individual admin-only actions within
 * a staff-accessible page (delete, consignment approval, etc.) should call
 * requireAdmin() instead, and the src/lib/permissions.ts helpers decide
 * what to show/hide in between.
 */
export async function requireStaff(): Promise<Session["user"]> {
  const user = await requireUser();
  if (!isStaff(user.role)) {
    redirect("/account");
  }
  return user;
}

/**
 * Require an ADMIN user specifically. A signed-in SALES user hitting an
 * admin-only page/action is staff, just not allowed here — send them back
 * to the admin dashboard rather than all the way out to /account. Anyone
 * who isn't staff at all gets bounced to /account like requireStaff does.
 */
export async function requireAdmin(): Promise<Session["user"]> {
  const user = await requireUser();
  if (user.role === Role.ADMIN) return user;
  redirect(isStaff(user.role) ? "/admin" : "/account");
}
