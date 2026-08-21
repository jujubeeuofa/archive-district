"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { AuthenticityStatus, ItemSource, ItemStatus, SubmissionStatus } from "@/lib/enums";
import { parseChecklistFromFormData } from "@/lib/authenticity";

export async function updateSubmissionStatus(submissionId: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status") || "") as SubmissionStatus;
  await prisma.sellSubmission.update({ where: { id: submissionId }, data: { status } });
  revalidatePath(`/admin/submissions/${submissionId}`);
  revalidatePath("/admin/submissions");
}

export async function makeOffer(submissionId: string, formData: FormData) {
  await requireAdmin();
  const offerAmount = Number(formData.get("offerAmount"));
  if (!Number.isFinite(offerAmount) || offerAmount <= 0) return;

  await prisma.sellSubmission.update({
    where: { id: submissionId },
    data: { offerAmount, status: SubmissionStatus.OFFER_MADE },
  });
  revalidatePath(`/admin/submissions/${submissionId}`);
  revalidatePath("/admin/submissions");
}

/**
 * Saves a filled-out authenticity checklist for a sell submission — the
 * same checklist component/shape as items, but attached to the submission
 * ahead of any decision to convert it into inventory. If the submission
 * later gets converted, this check carries over to the new Item so the
 * audit trail (who reviewed what, and when) isn't lost.
 */
export async function saveSubmissionAuthenticityCheck(submissionId: string, formData: FormData) {
  const admin = await requireAdmin();

  const submission = await prisma.sellSubmission.findUnique({ where: { id: submissionId } });
  if (!submission) return;

  const checklist = parseChecklistFromFormData(submission.brand, formData);
  const decision = String(formData.get("decision") || AuthenticityStatus.UNVERIFIED) as AuthenticityStatus;
  const notes = String(formData.get("notes") || "").trim() || null;

  await prisma.authenticityCheck.upsert({
    where: { sellSubmissionId: submissionId },
    create: {
      sellSubmissionId: submissionId,
      brand: submission.brand,
      checklist: JSON.stringify(checklist),
      decision,
      notes,
      reviewedById: admin.id,
    },
    update: {
      brand: submission.brand,
      checklist: JSON.stringify(checklist),
      decision,
      notes,
      reviewedById: admin.id,
    },
  });

  await prisma.sellSubmission.update({ where: { id: submissionId }, data: { authenticityStatus: decision } });

  revalidatePath(`/admin/submissions/${submissionId}`);
  revalidatePath("/admin/submissions");
}

/**
 * Accepting a submission creates a new Item (source CONSIGNED) copying
 * over the details + photos, and marks the submission ACCEPTED. If the
 * submission has a saved authenticity check, it carries over to the new
 * item (same decision + checklist snapshot) rather than resetting to
 * Unverified.
 */
export async function convertToInventory(submissionId: string) {
  await requireAdmin();

  const submission = await prisma.sellSubmission.findUnique({
    where: { id: submissionId },
    include: { photos: true, authenticityCheck: true },
  });
  if (!submission) return;

  const item = await prisma.item.create({
    data: {
      title: submission.title,
      brand: submission.brand,
      category: submission.category,
      condition: "Unspecified — set on intake",
      description: submission.description,
      costPrice: submission.offerAmount ?? 0,
      listPrice: submission.offerAmount ? submission.offerAmount * 1.8 : 0,
      status: ItemStatus.PENDING_INTAKE,
      authenticityStatus: submission.authenticityStatus,
      source: ItemSource.CONSIGNED,
      photos: {
        create: submission.photos.map((p) => ({ dataUrl: p.dataUrl })),
      },
    },
  });

  if (submission.authenticityCheck) {
    await prisma.authenticityCheck.create({
      data: {
        itemId: item.id,
        brand: submission.authenticityCheck.brand,
        checklist: submission.authenticityCheck.checklist,
        decision: submission.authenticityCheck.decision,
        notes: submission.authenticityCheck.notes,
        reviewedById: submission.authenticityCheck.reviewedById,
      },
    });
  }

  await prisma.sellSubmission.update({
    where: { id: submissionId },
    data: { status: SubmissionStatus.ACCEPTED },
  });

  revalidatePath("/admin/submissions");
  revalidatePath("/admin/inventory");
  redirect(`/admin/inventory/${item.id}`);
}
