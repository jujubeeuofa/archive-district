import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logManualPayment, updateOrderStatus } from "../actions";
import AdminNav from "@/components/AdminNav";
import MessageThread from "@/components/MessageThread";
import { formatMoney, formatDate, statusBadgeClass } from "@/lib/format";
import { OrderStatus } from "@/lib/enums";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      buyer: true,
      items: { include: { item: true } },
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const boundLogPayment = logManualPayment.bind(null, order.id);
  const boundUpdateStatus = updateOrderStatus.bind(null, order.id);

  return (
    <div>
      <AdminNav active="/admin/orders" />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display uppercase text-bone">Order {order.id.slice(0, 8)}</h1>
          <p className="text-sm text-ink-400">
            Buyer: {order.buyer.name} ({order.buyer.email})
          </p>
          <p className="text-xs text-ink-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <span className={`badge ${statusBadgeClass(order.status)}`}>{order.status}</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <p className="label mb-2">Line items</p>
            <div className="divide-y divide-ink-700">
              {order.items.map((oi) => (
                <div key={oi.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-bone">{oi.item.title}</p>
                    <p className="text-xs text-ink-400">{oi.item.brand}</p>
                  </div>
                  <p className="text-sm text-bone">{formatMoney(oi.priceAtSale)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-ink-700 pt-3 text-sm">
              <span className="text-ink-400">Subtotal</span>
              <span className="text-bone">{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-ink-300">Total</span>
              <span className="text-bone">{formatMoney(order.total)}</span>
            </div>
          </div>

          <MessageThread
            messages={order.messages}
            currentUserId={admin.id}
            orderId={order.id}
            redirectPath={`/admin/orders/${order.id}`}
          />
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="label">Current tender</p>
            <p className="text-sm text-bone">{order.tenderType}</p>
            {order.stripeSessionId && (
              <p className="mt-1 break-all text-xs text-ink-500">
                Stripe session: {order.stripeSessionId}
              </p>
            )}
          </div>

          {order.status !== OrderStatus.PAID && (
            <div className="card p-5">
              <p className="label mb-2">Log manual payment</p>
              <p className="text-xs text-ink-500 mb-3">
                Use this for in-person cash sales or other tender not processed through Stripe.
              </p>
              <form action={boundLogPayment} className="space-y-2">
                <select className="input" name="tenderType" defaultValue="CASH">
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </select>
                <button type="submit" className="btn-primary w-full">
                  Mark paid
                </button>
              </form>
            </div>
          )}

          <div className="card p-5">
            <p className="label mb-2">Order status</p>
            <form action={boundUpdateStatus} className="flex gap-2">
              <select className="input" name="status" defaultValue={order.status}>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="CANCELED">Canceled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <button type="submit" className="btn-secondary shrink-0">
                Save
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
