import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/enums";
import { formatDate, formatMoney } from "@/lib/format";
import AdminNav from "@/components/AdminNav";
import SendTestPushButton from "@/components/SendTestPushButton";

export default async function AdminClientsPage() {
  await requireStaff();

  const clients = await prisma.user.findMany({
    where: { role: Role.CLIENT },
    include: {
      _count: { select: { orders: true, submissions: true, pushSubscriptions: true } },
      creditTransactions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const creditBalanceOf = (c: (typeof clients)[number]) =>
    c.creditTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      <AdminNav active="/admin/clients" />
      <h1 className="text-2xl font-display uppercase text-bone">Clients</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left text-xs uppercase text-ink-400">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Orders</th>
              <th className="px-4 py-2">Submissions</th>
              <th className="px-4 py-2">Credit</th>
              <th className="px-4 py-2">Joined</th>
              <th className="px-4 py-2">Push</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-t border-ink-800">
                <td className="px-4 py-2">
                  <Link href={`/admin/clients/${c.id}`} className="text-bone hover:text-accent">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-ink-300">{c.email}</td>
                <td className="px-4 py-2 text-ink-300">{c.phone || "—"}</td>
                <td className="px-4 py-2 text-ink-300">{c._count.orders}</td>
                <td className="px-4 py-2 text-ink-300">{c._count.submissions}</td>
                <td className="px-4 py-2 text-ink-300">{formatMoney(creditBalanceOf(c))}</td>
                <td className="px-4 py-2 text-ink-400">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-2">
                  {c._count.pushSubscriptions > 0 ? (
                    <SendTestPushButton userId={c.id} />
                  ) : (
                    <span className="text-xs text-ink-500">Not subscribed</span>
                  )}
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ink-500">
                  No clients yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
