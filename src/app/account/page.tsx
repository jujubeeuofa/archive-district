import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate, statusBadgeClass } from "@/lib/format";
import PushSubscribeButton from "@/components/PushSubscribeButton";

export default async function AccountPage() {
  const user = await requireUser();

  const [profile, orders, submissions] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.order.findMany({
      where: { buyerId: user.id },
      include: { items: { include: { item: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sellSubmission.findMany({
      where: { clientId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-display uppercase text-bone">My account</h1>
        <div className="card mt-4 p-5">
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <p className="label">Name</p>
              <p className="text-bone">{profile?.name}</p>
            </div>
            <div>
              <p className="label">Email</p>
              <p className="text-bone">{profile?.email}</p>
            </div>
            <div>
              <p className="label">Phone</p>
              <p className="text-bone">{profile?.phone || "—"}</p>
            </div>
          </div>
          <div className="mt-4 border-t border-ink-700 pt-4">
            <p className="label mb-2">Notifications</p>
            <PushSubscribeButton />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-bone">Order history</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-ink-400">
            No orders yet. <Link href="/shop" className="text-accent">Browse the shop →</Link>
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-ink-700">
            <table className="w-full text-sm">
              <thead className="bg-ink-800 text-left text-xs uppercase text-ink-400">
                <tr>
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Items</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-ink-800 hover:bg-ink-900/50">
                    <td className="px-4 py-2">
                      <Link href={`/account/orders/${o.id}`} className="text-accent hover:text-accent-light">
                        {o.id.slice(0, 8)}
                      </Link>
                    </td>
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
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-bone">Sell submissions</h2>
          <Link href="/sell" className="btn-secondary">
            Submit an item
          </Link>
        </div>
        {submissions.length === 0 ? (
          <p className="mt-2 text-sm text-ink-400">No submissions yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {submissions.map((s) => (
              <Link
                key={s.id}
                href={`/account/submissions/${s.id}`}
                className="card block p-4 hover:border-accent/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-accent">{s.brand}</p>
                    <p className="text-sm font-medium text-bone">{s.title}</p>
                  </div>
                  <span className={`badge ${statusBadgeClass(s.status)}`}>{s.status.replace("_", " ")}</span>
                </div>
                {s.offerAmount != null && (
                  <p className="mt-2 text-sm text-ink-300">Offer: {formatMoney(s.offerAmount)}</p>
                )}
                <p className="mt-1 text-xs text-ink-500">{formatDate(s.createdAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
