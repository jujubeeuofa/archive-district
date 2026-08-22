"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { Role } from "@/lib/enums";

function isStaffRole(value: string): value is typeof Role.ADMIN | typeof Role.SALES {
  return value === Role.ADMIN || value === Role.SALES;
}

/**
 * Admin-only: creates a new staff (ADMIN or SALES) account with a password
 * set directly here. There's no invite-by-email flow yet — the Admin sets
 * a temporary password and shares it with the new hire themselves. Silent
 * no-op on invalid input, matching the rest of this codebase's admin forms
 * (no error-state plumbing here yet).
 */
export async function createStaffUser(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const roleRaw = String(formData.get("role") || Role.SALES);

  if (!name || !email || !password) return;
  if (password.length < 8) return;
  if (!isStaffRole(roleRaw)) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, passwordHash, role: roleRaw, active: true },
  });

  revalidatePath("/admin/staff");
}

/** Flips a staff account's active flag — deactivating blocks future logins without deleting their history. */
export async function toggleStaffActive(userId: string) {
  const admin = await requireAdmin();
  if (userId === admin.id) return; // can't deactivate your own account

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return;

  await prisma.user.update({ where: { id: userId }, data: { active: !target.active } });
  revalidatePath("/admin/staff");
}

/** Changes a staff member's role between ADMIN and SALES. Can't demote your own account (avoids locking out the last admin). */
export async function setStaffRole(userId: string, formData: FormData) {
  const admin = await requireAdmin();
  const roleRaw = String(formData.get("role") || "");
  if (!isStaffRole(roleRaw)) return;
  if (userId === admin.id && roleRaw !== Role.ADMIN) return;

  await prisma.user.update({ where: { id: userId }, data: { role: roleRaw } });
  revalidatePath("/admin/staff");
}
