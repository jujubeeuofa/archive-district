import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatMoney, formatDate, statusBadgeClass } from "@/lib/format";
import MessageThread from "@/components/MessageThread";
import { reconcileOrderWithStripe } from "@/lib/reconcileOrder";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { success?: string; demo?: string };
}) {
  const user = await requireUser();

  if (searchParams.success === "1") {
    await reconcileOrderWithStripe(params.id);
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { item: true } },
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!order || (order.buyerId !== user.id && user.role !== "ADMIN")) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {searchParams.demo === "1" && (
        <div className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent-light">
          Demo checkout complete — this order was marked paid without calling Stripe because no
          STRIPE_SECRET_KEY is configured. See README for enabling live Stripe.
        </div>
      )}
      {searchParams.success === "1" && searchParams.demo !== "1" && (
        <div className="rounded-lg border border-emerald-700 bg-emerald-900/30 px-4 py-3 text-sm text-emerald-300">
          Payment confirmed via Stripe. Thank you!
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <Link href="/account" className="text-sm text-accent hover:text-accent-light">
            ← Back to account
          </Link>
          <h1 className="mt-1 text-2xl font-display uppercase text-bone">Order {order.id.slice(0, 8)}</h1>
        </div>
        <span className={`badge ${statusBadgeClass(order.status)}`}>{order.status}</span>
      </div>

      <div className="card p-5">
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <p className="label">Placed</p>
            <p className="text-bone">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="label">Tender</p>
            <p className="text-bone">{order.tenderType}</p>
          </div>
          <div>
            <p className="label">Total</p>
            <p className="text-bone">{formatMoney(order.total)}</p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-ink-700 border-t border-ink-700">
          {order.items.map((oi) => (
            <div key={oi.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-bone">{oi.item.title}</p>
                <p className="text-xs text-ink-400">{oi.item.brand}</p>
              </div>
              <p className="text-sm text-bone">{formatMoney(oi.priceAtSale)}</p>
            </div>
          ))}
        </div>
      </div>

      <MessageThread
        messages={order.messages}
        currentUserId={user.id}
        orderId={order.id}
        redirectPath={`/account/orders/${order.id}`}
      />
    </div>
  );
}
