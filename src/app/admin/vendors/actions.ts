"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireStaff } from "@/lib/session";

function trimmedOrNull(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) || "").trim();
  return v || null;
}

export async function createVendor(formData: FormData) {
  await requireStaff();

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const vendor = await prisma.vendor.create({
    data: {
      name,
      contactName: trimmedOrNull(formData, "contactName"),
      email: trimmedOrNull(formData, "email"),
      phone: trimmedOrNull(formData, "phone"),
      notes: trimmedOrNull(formData, "notes"),
    },
  });

  revalidatePath("/admin/vendors");
  redirect(`/admin/vendors/${vendor.id}`);
}

export async function updateVendor(vendorId: string, formData: FormData) {
  await requireStaff();

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      name,
      contactName: trimmedOrNull(formData, "contactName"),
      email: trimmedOrNull(formData, "email"),
      phone: trimmedOrNull(formData, "phone"),
      notes: trimmedOrNull(formData, "notes"),
    },
  });

  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/admin/vendors");
}

/**
 * Deleting a vendor never deletes the items it supplied — Item.vendorId is
 * onDelete: SetNull in the schema, so those items just go back to having no
 * vendor on record instead of disappearing or blocking the delete.
 */
export async function deleteVendor(vendorId: string) {
  await requireAdmin();
  await prisma.vendor.delete({ where: { id: vendorId } });
  revalidatePath("/admin/vendors");
  redirect("/admin/vendors");
}
