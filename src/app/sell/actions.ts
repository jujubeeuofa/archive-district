"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SubmissionStatus } from "@/lib/enums";
import { notifyStaffOfSubmission } from "@/lib/staffAlerts";

export async function submitSellForm(formData: FormData) {
  const user = await requireUser();

  const brand = String(formData.get("brand") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const askingPriceRaw = String(formData.get("askingPrice") || "").trim();
  const askingPrice = askingPriceRaw ? Number(askingPriceRaw) : null;
  const photoUrls = formData.getAll("photos").map(String).filter(Boolean);

  if (!brand || !category || !title || !description) {
    throw new Error("Brand, category, title, and description are required.");
  }

  const submission = await prisma.sellSubmission.create({
    data: {
      clientId: user.id,
      brand,
      category,
      title,
      description,
      askingPrice: askingPrice && !Number.isNaN(askingPrice) ? askingPrice : null,
      status: SubmissionStatus.SUBMITTED,
      photos: { create: photoUrls.map((dataUrl) => ({ dataUrl })) },
    },
  });

  await notifyStaffOfSubmission(user, submission).catch((err) => {
    console.error("Failed to notify staff of new sell submission:", err);
  });

  redirect(`/account/submissions/${submission.id}`);
}
