"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

/**
 * Toggles the client's opt-in for "new item added to inventory" push
 * notifications. Bound to the signed-in user's id from the account page —
 * same .bind(null, id) pattern used throughout admin CRUD.
 */
export async function updateNotificationPreference(userId: string, formData: FormData) {
  const user = await requireUser();
  if (user.id !== userId) return;

  const notifyNewItems = formData.get("notifyNewItems") === "on";

  await prisma.user.update({
    where: { id: userId },
    data: { notifyNewItems },
  });

  revalidatePath("/account");
}
