"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function postMessage(formData: FormData) {
  const user = await requireUser();

  const body = String(formData.get("body") || "").trim();
  const orderId = (formData.get("orderId") as string) || null;
  const sellSubmissionId = (formData.get("sellSubmissionId") as string) || null;
  const redirectPath = String(formData.get("redirectPath") || "/account");

  if (!body) return;
  if (!orderId && !sellSubmissionId) return;

  await prisma.message.create({
    data: {
      senderId: user.id,
      body,
      orderId: orderId || undefined,
      sellSubmissionId: sellSubmissionId || undefined,
    },
  });

  revalidatePath(redirectPath);
}
