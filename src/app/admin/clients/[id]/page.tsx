import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/enums";
import { formatMoney, formatDate, statusBadgeClass } from "@/lib/format";
import { getCreditBalance } from "@/lib/credit";
import { canAdjustCredit } from "@/lib/permissions";
import AdminNav from "@/components/AdminNav";
import { adjustCredit } from "../actions";

export default async function AdminClientDetailPage({ params }: { params: { id: string } }) {
  const user = await requireStaff();
  const showAdjust = canAdjustCredit(user.role);

  const client = await prisma.user.findUnique({ where: { id: params.id } });
  if (!client || client.role !== Role.CLIENT) notFound();

  const [orders, submissions, creditBalance, creditTransactions] = await Promise.all([
    prisma.order.findMany({ where: { buyerId: client.id }, orderBy: { createdAt: "desc" } }),
    prisma.sellSubmission.findMany({ where: { clientId: client.id }, orderBy: { createdAt: "desc" } }),
    getCreditBalance(client.id),
    prisma.creditTransaction.findMany({
      where: { userId: client.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const boundAdjust = adjustCredit.bind(null, client.id);

  return (
    <div>
      <AdminNav active="/admin/clients" />

      <h1 className="text-2xl font-display uppercase text-bone">{client.name}</h1>
      <p className="text-sm text-ink-400">
        {client.email} {client.phone ? `· ${client.phone}` : ""} · Joined {formatDate(client.createdAt)}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <p className="label mb-2">Orders ({orders.length})</p>
            {orders.length === 0 ? (
              <p className="text-sm text-ink-500">None yet.</p>
            ) : (
              <ul className="divide-y divide-ink-800">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                    <Link href={`/admin/orders/${o.id}`} className="text-bone hover:text-accent">
                      Order {o.id.slice(0, 8)}
                    </Link>
                    <span className={`badge ${statusBadgeClass(o.status)}`}>{o.status}</span>
                    <span className="text-ink-300">{formatMoney(o.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <p className="label mb-2">Sell submissions ({submissions.length})</p>
            {submissions.length === 0 ? (
              <p className="text-sm text-ink-500">None yet.</p>
            ) : (
              <ul className="divide-y divide-ink-800">
                {submissions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                    <Link href={`/admin/submissions/${s.id}`} className="text-bone hover:text-accent">
                      {s.title}
                    </Link>
                    <span className={`badge ${statusBadgeClass(s.status)}`}>{s.status.replace("_", " ")}</span>
                    <span className="text-ink-300">
                      {s.offerAmount != null ? formatMoney(s.offerAmount) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="label">Trade-in credit balance</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400">{formatMoney(creditBalance)}</p>

            {showAdjust ? (
              <form action={boundAdjust} className="mt-4 space-y-2 border-t border-ink-700 pt-4">
                <p className="label">Adjust balance</p>
                <input
                  className="input"
                  type="number"
                  name="amount"
                  step="0.01"
                  placeholder="Amount (e.g. 25 or -10)"
                  required
                />
                <input
                  className="input"
                  type="text"
                  name="reason"
                  placeholder="Reason (required)"
                  required
                />
                <button type="submit" className="btn-secondary w-full">
                  Apply adjustment
                </button>
              </form>
            ) : (
              <p className="mt-4 border-t border-ink-700 pt-4 text-xs text-ink-500">
                Only an Admin can adjust a client&apos;s store-credit balance.
              </p>
            )}

            {creditTransactions.length > 0 && (
              <div className="mt-4 divide-y divide-ink-800 border-t border-ink-700 pt-3">
                {creditTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="text-bone">{t.reason}</p>
                      <p className="text-xs text-ink-500">
                        {t.type} · {formatDate(t.createdAt)}
                      </p>
                    </div>
                    <span className={t.amount >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {t.amount >= 0 ? "+" : ""}
                      {formatMoney(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
