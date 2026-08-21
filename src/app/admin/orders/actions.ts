"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { ItemStatus, OrderStatus, TenderType } from "@/lib/enums";

/**
 * Log a manual CASH or OTHER payment against a PENDING order — no Stripe
 * involved. Marks the order PAID and its items SOLD.
 */
export async function logManualPayment(orderId: string, formData: FormData) {
  await requireAdmin();

  const tenderType = String(formData.get("tenderType") || TenderType.CASH) as TenderType;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.PAID, tenderType },
  });

  for (const oi of order.items) {
    await prisma.item.update({
      where: { id: oi.itemId },
      data: { status: ItemStatus.SOLD, soldPrice: oi.priceAtSale },
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function updateOrderStatus(orderId: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status") || "") as OrderStatus;
  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}
