import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ItemStatus, OrderStatus, SubmissionStatus } from "@/lib/enums";
import { formatMoney, formatDate, statusBadgeClass } from "@/lib/format";
import AdminNav from "@/components/AdminNav";

export default async function AdminDashboard() {
  await requireStaff();

  const [revenueAgg, itemsInStock, pendingSubmissions, pendingAuth, flaggedItems, recentOrders] = await Promise.all([
    prisma.order.aggregate({
      where: { status: OrderStatus.PAID },
      _sum: { total: true },
    }),
    prisma.item.count({ where: { status: ItemStatus.IN_STOCK } }),
    prisma.sellSubmission.count({
      where: { status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.IN_REVIEW, SubmissionStatus.OFFER_MADE] } },
    }),
    prisma.item.count({
      where: { authenticityStatus: "UNVERIFIED", status: { in: [ItemStatus.IN_STOCK, ItemStatus.HELD, ItemStatus.PENDING_INTAKE] } },
    }),
    prisma.item.count({ where: { authenticityStatus: "FLAGGED" } }),
    prisma.order.findMany({
      include: { buyer: true, items: { include: { item: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const revenue = revenueAgg._sum.total || 0;

  const stats = [
    { label: "Revenue (paid orders)", value: formatMoney(revenue) },
    { label: "Items in stock", value: String(itemsInStock) },
    { label: "Pending submissions", value: String(pendingSubmissions), href: "/admin/submissions" },
    { label: "Awaiting authentication", value: String(pendingAuth), href: "/admin/inventory?authenticity=UNVERIFIED" },
    { label: "Flagged items", value: String(flaggedItems), href: "/admin/inventory?authenticity=FLAGGED", warn: flaggedItems > 0 },
  ];

  return (
    <div>
      <AdminNav active="/admin" />
      <h1 className="text-2xl font-display uppercase text-bone">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => {
          const content = (
            <>
              <p className="text-xs uppercase tracking-wide text-ink-400">{s.label}</p>
              <p className={`mt-2 font-display text-2xl ${s.warn ? "text-red-400" : "text-bone"}`}>{s.value}</p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="card p-5 transition-colors hover:border-accent">
              {content}
            </Link>
          ) : (
            <div key={s.label} className="card p-5">
              {content}
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-bone">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-accent hover:text-accent-light">
            View all →
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-ink-700">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-left text-xs uppercase text-ink-400">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Buyer</th>
                <th className="px-4 py-2">Items</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
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
                  <td className="px-4 py-2">
                    <span className={`badge ${statusBadgeClass(o.status)}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-2 text-ink-400">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
