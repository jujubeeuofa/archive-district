import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ItemStatus, OrderStatus, TenderType } from "@/lib/enums";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { getCreditBalance } from "@/lib/credit";
import { markOrderPaidAndFulfill } from "@/lib/orderFulfillment";

/**
 * POST /api/checkout { itemId, creditToApply? }
 *
 * Creates a pending Order + OrderItem for the given in-stock item, applying
 * up to the buyer's available trade-in credit toward it (clamped server-side
 * — never trust the client's number), then:
 *  - If the credit applied covers the full price, there's nothing left to
 *    charge: skip Stripe entirely and mark the order paid immediately via
 *    markOrderPaidAndFulfill (which also redeems the credit).
 *  - Else if STRIPE_SECRET_KEY is set, creates a real Stripe Checkout
 *    Session for the remaining balance and returns its URL for redirect.
 *  - Else, this is the DEMO FALLBACK: the order is marked PAID immediately
 *    (no Stripe call) for the remaining balance, so the full purchase flow
 *    works with zero external setup. See README for how to switch to live
 *    Stripe.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in to buy." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const itemId = body?.itemId as string | undefined;
  const requestedCredit = Number(body?.creditToApply) || 0;
  if (!itemId) {
    return NextResponse.json({ error: "itemId is required." }, { status: 400 });
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.status !== ItemStatus.IN_STOCK) {
    return NextResponse.json({ error: "Item is not available for purchase." }, { status: 400 });
  }

  const balance = await getCreditBalance(session.user.id);
  const creditApplied = Math.max(0, Math.min(requestedCredit, balance, item.listPrice));
  const total = Math.round((item.listPrice - creditApplied) * 100) / 100;

  const order = await prisma.order.create({
    data: {
      buyerId: session.user.id,
      status: OrderStatus.PENDING,
      subtotal: item.listPrice,
      total,
      creditApplied,
      tenderType: TenderType.CARD,
      items: { create: [{ itemId: item.id, priceAtSale: item.listPrice }] },
    },
  });

  if (total <= 0) {
    // Fully covered by trade-in credit — nothing to charge.
    await markOrderPaidAndFulfill(order.id);
    return NextResponse.json({ url: `/account/orders/${order.id}?demo=1`, demo: true });
  }

  if (!stripeConfigured()) {
    // --- DEMO FALLBACK: no Stripe key set, mark paid immediately. ---
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: `demo_${order.id}` },
    });
    await markOrderPaidAndFulfill(order.id);

    return NextResponse.json({
      url: `/account/orders/${order.id}?demo=1`,
      demo: true,
    });
  }

  try {
    const stripe = getStripe();
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(total * 100),
            product_data: {
              name: `${item.brand} — ${item.title}`,
              description:
                creditApplied > 0
                  ? `${item.description?.slice(0, 400) ?? ""} (${creditApplied.toFixed(2)} trade-in credit applied)`
                  : item.description?.slice(0, 500),
            },
          },
        },
      ],
      success_url: `${origin}/account/orders/${order.id}?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/${item.id}?canceled=1`,
      metadata: { orderId: order.id, itemId: item.id },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Stripe checkout failed. Check server logs / STRIPE_SECRET_KEY." },
      { status: 500 }
    );
  }
}
