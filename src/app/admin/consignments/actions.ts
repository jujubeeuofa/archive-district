"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { ConsignmentStatus } from "@/lib/enums";
import { generateSignToken } from "@/lib/consignment";

/**
 * Sets up a new per-item consignment agreement in DRAFT status. Called from
 * the item's admin detail page. contractTerms comes pre-filled from
 * buildDefaultConsignmentContract() on that page, but admin can edit the
 * textarea before submitting.
 */
export async function createConsignmentAgreement(itemId: string, formData: FormData) {
  await requireAdmin();

  const consignorName = String(formData.get("consignorName") || "").trim();
  const consignorSplitPct = Number(formData.get("consignorSplitPct"));
  const listPrice = Number(formData.get("listPrice"));
  const floorPriceRaw = String(formData.get("floorPrice") || "").trim();
  const contractTerms = String(formData.get("contractTerms") || "").trim();

  if (!consignorName || !Number.isFinite(consignorSplitPct) || !Number.isFinite(listPrice) || !contractTerms) {
    return;
  }

  const agreement = await prisma.consignmentAgreement.create({
    data: {
      itemId,
      consignorName,
      consignorEmail: String(formData.get("consignorEmail") || "").trim() || null,
      consignorPhone: String(formData.get("consignorPhone") || "").trim() || null,
      consignorSplitPct,
      listPrice,
      floorPrice: floorPriceRaw ? Number(floorPriceRaw) : null,
      contractTerms,
      signToken: generateSignToken(),
    },
  });

  revalidatePath(`/admin/inventory/${itemId}`);
  revalidatePath("/admin/consignments");
  redirect(`/admin/consignments/${agreement.id}`);
}

/** Only allowed while still DRAFT — once SENT, the terms are what's on offer. */
export async function updateConsignmentTerms(agreementId: string, formData: FormData) {
  await requireAdmin();

  const agreement = await prisma.consignmentAgreement.findUnique({ where: { id: agreementId } });
  if (!agreement || agreement.status !== ConsignmentStatus.DRAFT) return;

  const consignorName = String(formData.get("consignorName") || "").trim();
  const consignorSplitPct = Number(formData.get("consignorSplitPct"));
  const listPrice = Number(formData.get("listPrice"));
  const floorPriceRaw = String(formData.get("floorPrice") || "").trim();
  const contractTerms = String(formData.get("contractTerms") || "").trim();

  if (!consignorName || !Number.isFinite(consignorSplitPct) || !Number.isFinite(listPrice) || !contractTerms) {
    return;
  }

  await prisma.consignmentAgreement.update({
    where: { id: agreementId },
    data: {
      consignorName,
      consignorEmail: String(formData.get("consignorEmail") || "").trim() || null,
      consignorPhone: String(formData.get("consignorPhone") || "").trim() || null,
      consignorSplitPct,
      listPrice,
      floorPrice: floorPriceRaw ? Number(floorPriceRaw) : null,
      contractTerms,
    },
  });

  revalidatePath(`/admin/consignments/${agreementId}`);
}

/** Marks the agreement SENT — just a tracking status; the sign link works regardless. */
export async function markConsignmentSent(agreementId: string) {
  await requireAdmin();
  const agreement = await prisma.consignmentAgreement.findUnique({ where: { id: agreementId } });
  if (!agreement || agreement.status !== ConsignmentStatus.DRAFT) return;

  await prisma.consignmentAgreement.update({
    where: { id: agreementId },
    data: { status: ConsignmentStatus.SENT },
  });
  revalidatePath(`/admin/consignments/${agreementId}`);
  revalidatePath("/admin/consignments");
}

export async function voidConsignment(agreementId: string) {
  await requireAdmin();
  await prisma.consignmentAgreement.update({
    where: { id: agreementId },
    data: { status: ConsignmentStatus.VOIDED },
  });
  revalidatePath(`/admin/consignments/${agreementId}`);
  revalidatePath("/admin/consignments");
}

export async function markConsignmentPaid(agreementId: string, formData: FormData) {
  await requireAdmin();
  const paidNote = String(formData.get("paidNote") || "").trim() || null;

  await prisma.consignmentAgreement.update({
    where: { id: agreementId },
    data: {
      payoutStatus: "PAID",
      paidAt: new Date(),
      paidNote,
    },
  });
  revalidatePath(`/admin/consignments/${agreementId}`);
  revalidatePath("/admin/consignments");
}
