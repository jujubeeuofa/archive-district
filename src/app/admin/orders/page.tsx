import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate, statusBadgeClass } from "@/lib/format";
import AdminNav from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireAdmin();

  const { status } = searchParams;
  const where = status ? { status } : {};

  const orders = await prisma.order.findMany({
    where,
    include: { buyer: true, items: { include: { item: true } } },
    orderBy: { createdAt: "desc" },
  });

  const statuses = ["PENDING", "PAID", "CANCELED", "REFUNDED"];

  return (
    <div>
      <AdminNav active="/admin/orders" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display uppercase text-bone">Orders</h1>
        <Link href="/admin/orders/new" className="btn-primary">
          Log walk-in sale
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`badge ${!status ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`badge ${status === s ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left text-xs uppercase text-ink-400">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Buyer</th>
              <th className="px-4 py-2">Items</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Tender</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-ink-800 hover:bg-ink-900/50">
                <td className="px-4 py-2">
                  <Link href={`/admin/orders/${o.id}`} className="text-accent hover:text-accent-light">
                    {o.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-2 text-ink-300">{o.buyer.name}</td>
                <td className="px-4 py-2 text-ink-300">
                  {o.items.map((oi) => oi.item.title).join(", ")}
                </td>
                <td className="px-4 py-2">{formatMoney(o.total)}</td>
                <td className="px-4 py-2 text-ink-300">{o.tenderType}</td>
                <td className="px-4 py-2">
                  <span className={`badge ${statusBadgeClass(o.status)}`}>{o.status}</span>
                </td>
                <td className="px-4 py-2 text-ink-400">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-500">
                  No orders match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
