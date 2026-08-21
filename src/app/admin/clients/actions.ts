"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { CreditTransactionType } from "@/lib/enums";

/**
 * Manual trade-in credit adjustment — goodwill credit, a correction, etc.
 * Not tied to a sell submission or order. Amount can be positive (add to
 * balance) or negative (subtract); a reason is required since this shows up
 * in the customer's own credit history.
 */
export async function adjustCredit(userId: string, formData: FormData) {
  const admin = await requireAdmin();

  const amount = Number(formData.get("amount"));
  const reason = String(formData.get("reason") || "").trim();
  if (!Number.isFinite(amount) || amount === 0 || !reason) return;

  await prisma.creditTransaction.create({
    data: {
      userId,
      type: CreditTransactionType.ADJUSTED,
      amount,
      reason,
      createdById: admin.id,
    },
  });

  revalidatePath(`/admin/clients/${userId}`);
  revalidatePath("/admin/clients");
}
