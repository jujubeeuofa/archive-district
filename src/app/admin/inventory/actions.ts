"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { AuthenticityStatus, ItemSource, ItemStatus } from "@/lib/enums";
import { parseChecklistFromFormData } from "@/lib/authenticity";

function num(formData: FormData, key: string): number {
  const v = Number(formData.get(key));
  return Number.isFinite(v) ? v : 0;
}

function vendorId(formData: FormData): string | null {
  const v = String(formData.get("vendorId") || "").trim();
  return v || null;
}

export async function createItem(formData: FormData) {
  await requireAdmin();

  const photoUrls = formData.getAll("photos").map(String).filter(Boolean);

  const item = await prisma.item.create({
    data: {
      title: String(formData.get("title") || "").trim(),
      brand: String(formData.get("brand") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      condition: String(formData.get("condition") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      costPrice: num(formData, "costPrice"),
      listPrice: num(formData, "listPrice"),
      status: (String(formData.get("status") || ItemStatus.IN_STOCK) as ItemStatus),
      // authenticityStatus defaults to UNVERIFIED (schema default) — set
      // via the checklist on the item's edit page after creation.
      source: (String(formData.get("source") || ItemSource.PURCHASED) as ItemSource),
      vendorId: vendorId(formData),
      photos: { create: photoUrls.map((dataUrl) => ({ dataUrl })) },
    },
  });

  redirect(`/admin/inventory/${item.id}`);
}

export async function updateItem(itemId: string, formData: FormData) {
  await requireAdmin();

  const soldPriceRaw = String(formData.get("soldPrice") || "").trim();

  await prisma.item.update({
    where: { id: itemId },
    data: {
      title: String(formData.get("title") || "").trim(),
      brand: String(formData.get("brand") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      condition: String(formData.get("condition") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      costPrice: num(formData, "costPrice"),
      listPrice: num(formData, "listPrice"),
      soldPrice: soldPriceRaw ? Number(soldPriceRaw) : null,
      status: String(formData.get("status") || ItemStatus.IN_STOCK) as ItemStatus,
      // authenticityStatus is intentionally NOT set here — it's owned by
      // saveItemAuthenticityCheck below, driven by the checklist review,
      // not by a free-standing dropdown on the general edit form.
      source: String(formData.get("source") || ItemSource.PURCHASED) as ItemSource,
      vendorId: vendorId(formData),
    },
  });

  const newPhotoUrls = formData.getAll("newPhotos").map(String).filter(Boolean);
  if (newPhotoUrls.length > 0) {
    await prisma.photo.createMany({
      data: newPhotoUrls.map((dataUrl) => ({ dataUrl, itemId })),
    });
  }

  revalidatePath(`/admin/inventory/${itemId}`);
  revalidatePath("/admin/inventory");
}

/**
 * Saves a filled-out authenticity checklist for an item and syncs
 * Item.authenticityStatus to the reviewer's decision — the checklist in
 * AuthenticityCheck is the audit trail, the status field on Item stays the
 * quick-reference flag everything else (storefront badge, shop filtering,
 * reports) reads.
 */
export async function saveItemAuthenticityCheck(itemId: string, formData: FormData) {
  const admin = await requireAdmin();

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return;

  const checklist = parseChecklistFromFormData(item.brand, formData);
  const decision = String(formData.get("decision") || AuthenticityStatus.UNVERIFIED) as AuthenticityStatus;
  const notes = String(formData.get("notes") || "").trim() || null;

  await prisma.authenticityCheck.upsert({
    where: { itemId },
    create: {
      itemId,
      brand: item.brand,
      checklist: JSON.stringify(checklist),
      decision,
      notes,
      reviewedById: admin.id,
    },
    update: {
      brand: item.brand,
      checklist: JSON.stringify(checklist),
      decision,
      notes,
      reviewedById: admin.id,
    },
  });

  await prisma.item.update({ where: { id: itemId }, data: { authenticityStatus: decision } });

  revalidatePath(`/admin/inventory/${itemId}`);
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  revalidatePath(`/shop/${itemId}`);
  revalidatePath("/admin");
}

export async function deleteItemPhoto(itemId: string, photoId: string) {
  await requireAdmin();
  await prisma.photo.delete({ where: { id: photoId } });
  revalidatePath(`/admin/inventory/${itemId}`);
}

export async function deleteItem(itemId: string) {
  await requireAdmin();
  await prisma.item.delete({ where: { id: itemId } });
  redirect("/admin/inventory");
}
