"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { ItemStatus, OrderStatus, TenderType } from "@/lib/enums";
import { markOrderPaidAndFulfill } from "@/lib/orderFulfillment";

/**
 * Logs a whole sale in one step — for in-person transactions that never
 * went through the web checkout: a physical card terminal, the US Bank
 * iPhone app, or a plain cash/other sale rung up in the shop. Creates the
 * Order + OrderItem directly (skipping the PENDING-then-pay flow web
 * checkout uses) and immediately marks it paid via the same
 * markOrderPaidAndFulfill every other path uses, so item-sold and
 * consignor-payout side effects stay identical.
 *
 * Scaffolding note: this is a manual admin-entry flow, not a real US Bank
 * API/webhook integration — there's no processor transaction id captured
 * yet. Once US Bank's actual gateway details are available, the real
 * integration can either replace this form's submit handler or feed it via
 * a webhook that calls the same createWalkInSale-style logic.
 */
export async function createWalkInSale(formData: FormData) {
  await requireAdmin();

  const buyerId = String(formData.get("buyerId") || "").trim();
  const itemId = String(formData.get("itemId") || "").trim();
  const tenderType = String(formData.get("tenderType") || TenderType.CASH) as TenderType;
  const salePriceRaw = Number(formData.get("salePrice"));

  if (!buyerId || !itemId) return;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.status !== ItemStatus.IN_STOCK) return;

  const salePrice = Number.isFinite(salePriceRaw) && salePriceRaw > 0 ? salePriceRaw : item.listPrice;

  const order = await prisma.order.create({
    data: {
      buyerId,
      status: OrderStatus.PENDING,
      subtotal: salePrice,
      total: salePrice,
      tenderType,
      items: { create: [{ itemId, priceAtSale: salePrice }] },
    },
  });

  await markOrderPaidAndFulfill(order.id);

  revalidatePath("/admin/orders");
  revalidatePath("/admin/inventory");
  redirect(`/admin/orders/${order.id}`);
}

/**
 * Log a manual CASH, US_BANK, or OTHER payment against a PENDING order — no
 * Stripe involved. Marks the order PAID and its items SOLD.
 */
export async function logManualPayment(orderId: string, formData: FormData) {
  await requireAdmin();

  const tenderType = String(formData.get("tenderType") || TenderType.CASH) as TenderType;

  await prisma.order.update({
    where: { id: orderId },
    data: { tenderType },
  });
  await markOrderPaidAndFulfill(orderId);

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
