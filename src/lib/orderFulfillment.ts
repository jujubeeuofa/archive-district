import { prisma } from "@/lib/prisma";
import { ItemStatus, OrderStatus, ConsignmentPayoutStatus, CreditTransactionType } from "@/lib/enums";
import { computeConsignorPayout } from "@/lib/consignment";
import { notifyStaffOfPurchase } from "@/lib/staffAlerts";

/**
 * The single place an order actually gets marked paid and its items marked
 * sold — called from every path that can finalize a sale (the demo
 * checkout fallback, the Stripe webhook, the order-detail page's Stripe
 * reconciliation, and admin's manual "log payment"). Centralized so the two
 * side effects that need to happen exactly once per order — crediting a
 * consignor's payout, and redeeming any trade-in credit the buyer applied
 * at checkout — aren't duplicated (or missed) across those four call sites.
 *
 * Idempotent: safe to call more than once for the same order (e.g. a
 * webhook retry, or reconciliation running after the order is already
 * PAID) — already-PAID orders are skipped, and credit redemption is guarded
 * separately against being recorded twice.
 */
export async function markOrderPaidAndFulfill(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { buyer: true, items: { include: { item: { include: { consignmentAgreement: true } } } } },
  });
  if (!order || order.status === OrderStatus.PAID) return;

  await prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.PAID } });

  await notifyStaffOfPurchase(order.buyer, order).catch((err) => {
    console.error("Failed to notify staff of new purchase:", err);
  });

  for (const oi of order.items) {
    await prisma.item.update({
      where: { id: oi.itemId },
      data: { status: ItemStatus.SOLD, soldPrice: oi.priceAtSale },
    });

    const agreement = oi.item.consignmentAgreement;
    if (agreement && agreement.payoutStatus === ConsignmentPayoutStatus.NOT_YET_SOLD) {
      await prisma.consignmentAgreement.update({
        where: { id: agreement.id },
        data: {
          payoutStatus: ConsignmentPayoutStatus.OWED,
          payoutAmount: computeConsignorPayout(oi.priceAtSale, agreement.consignorSplitPct),
        },
      });
    }
  }

  if (order.creditApplied > 0) {
    const alreadyRedeemed = await prisma.creditTransaction.findFirst({
      where: { orderId: order.id, type: CreditTransactionType.REDEEMED },
    });
    if (!alreadyRedeemed) {
      await prisma.creditTransaction.create({
        data: {
          userId: order.buyerId,
          type: CreditTransactionType.REDEEMED,
          amount: -order.creditApplied,
          reason: `Applied to order ${order.id.slice(0, 8)}`,
          orderId: order.id,
        },
      });
    }
  }
}
