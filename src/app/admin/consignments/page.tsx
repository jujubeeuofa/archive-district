import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate, statusBadgeClass } from "@/lib/format";
import AdminNav from "@/components/AdminNav";

export default async function AdminConsignmentsPage() {
  await requireAdmin();

  const agreements = await prisma.consignmentAgreement.findMany({
    include: { item: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AdminNav active="/admin/consignments" />

      <h1 className="text-2xl font-display uppercase text-bone">Consignments</h1>
      <p className="mt-1 text-sm text-ink-400">
        Set up a new consignment agreement from an item&apos;s edit page — each item gets its own
        contract and e-sign link.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left text-xs uppercase text-ink-400">
            <tr>
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Consignor</th>
              <th className="px-4 py-2">Split</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Payout</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {agreements.map((a) => (
              <tr key={a.id} className="border-t border-ink-800">
                <td className="px-4 py-2">
                  <Link href={`/admin/consignments/${a.id}`} className="text-bone hover:text-accent">
                    {a.item.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-ink-300">{a.consignorName}</td>
                <td className="px-4 py-2 text-ink-300">
                  {a.consignorSplitPct}% / {100 - a.consignorSplitPct}%
                </td>
                <td className="px-4 py-2">
                  <span className={`badge ${statusBadgeClass(a.status)}`}>{a.status}</span>
                </td>
                <td className="px-4 py-2 text-ink-300">
                  {a.payoutStatus === "NOT_YET_SOLD" && "—"}
                  {a.payoutStatus === "OWED" && (
                    <span className="text-amber-300">Owed {formatMoney(a.payoutAmount)}</span>
                  )}
                  {a.payoutStatus === "PAID" && (
                    <span className="text-emerald-400">Paid {formatMoney(a.payoutAmount)}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-ink-400">{formatDate(a.createdAt)}</td>
              </tr>
            ))}
            {agreements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-500">
                  No consignment agreements yet — set one up from an item&apos;s edit page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
