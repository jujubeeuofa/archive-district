import { prisma } from "@/lib/prisma";
import { ItemStatus, OrderStatus } from "@/lib/enums";
import { getStripe, stripeConfigured } from "@/lib/stripe";

/**
 * Best-effort reconciliation for orders paid via real Stripe Checkout.
 * Called when an order detail page loads: if the order is still PENDING and
 * has a real (non-demo) Stripe session id, check the session's payment
 * status directly and mark the order PAID + item SOLD if it succeeded.
 * This lets the demo work correctly without requiring a public webhook URL.
 */
export async function reconcileOrderWithStripe(orderId: string) {
  if (!stripeConfigured()) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;
  if (order.status !== OrderStatus.PENDING) return;
  if (!order.stripeSessionId || order.stripeSessionId.startsWith("demo_")) return;

  try {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

    if (checkoutSession.payment_status === "paid") {
      await prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.PAID } });
      for (const oi of order.items) {
        await prisma.item.update({
          where: { id: oi.itemId },
          data: { status: ItemStatus.SOLD, soldPrice: oi.priceAtSale },
        });
      }
    }
  } catch (err) {
    console.error("Failed to reconcile order with Stripe:", err);
  }
}
