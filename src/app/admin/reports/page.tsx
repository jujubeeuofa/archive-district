import { requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeMargin, formatMoney } from "@/lib/format";
import { OrderStatus } from "@/lib/enums";
import { canSeeCost } from "@/lib/permissions";
import AdminNav from "@/components/AdminNav";

function groupMargins<T extends { costPrice: number; listPrice: number; soldPrice: number | null }>(
  items: T[],
  keyFn: (item: T) => string
) {
  const groups = new Map<string, { count: number; totalMargin: number; totalCost: number; totalRevenue: number }>();
  for (const item of items) {
    const key = keyFn(item);
    const { margin, basis } = computeMargin(item.costPrice, item.listPrice, item.soldPrice);
    const g = groups.get(key) || { count: 0, totalMargin: 0, totalCost: 0, totalRevenue: 0 };
    g.count += 1;
    g.totalMargin += margin;
    g.totalCost += item.costPrice;
    g.totalRevenue += basis;
    groups.set(key, g);
  }
  return Array.from(groups.entries())
    .map(([key, g]) => ({ key, ...g }))
    .sort((a, b) => b.totalMargin - a.totalMargin);
}

export default async function AdminReportsPage() {
  const user = await requireStaff();
  const showFinancials = canSeeCost(user.role);

  const items = await prisma.item.findMany({
    select: { brand: true, category: true, costPrice: true, listPrice: true, soldPrice: true },
  });

  const paidOrders = await prisma.order.findMany({
    where: { status: OrderStatus.PAID },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byBrand = groupMargins(items, (i) => i.brand);
  const byCategory = groupMargins(items, (i) => i.category);

  const byMonth = new Map<string, number>();
  for (const o of paidOrders) {
    const key = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }).format(o.createdAt);
    byMonth.set(key, (byMonth.get(key) || 0) + o.total);
  }
  const revenueRows = Array.from(byMonth.entries());

  return (
    <div>
      <AdminNav active="/admin/reports" />
      <h1 className="text-2xl font-display uppercase text-bone">Reports</h1>

      {!showFinancials && (
        <p className="mt-2 text-xs text-ink-500">
          Margin figures are hidden for your role — showing item counts and revenue only.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ReportTable title={showFinancials ? "Margin by brand" : "Revenue by brand"} rows={byBrand} showMargin={showFinancials} />
        <ReportTable title={showFinancials ? "Margin by category" : "Revenue by category"} rows={byCategory} showMargin={showFinancials} />
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-bone">Revenue over time (paid orders)</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-ink-700">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-left text-xs uppercase text-ink-400">
              <tr>
                <th className="px-4 py-2">Month</th>
                <th className="px-4 py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {revenueRows.map(([month, total]) => (
                <tr key={month} className="border-t border-ink-800">
                  <td className="px-4 py-2 text-bone">{month}</td>
                  <td className="px-4 py-2 text-bone">{formatMoney(total)}</td>
                </tr>
              ))}
              {revenueRows.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-ink-500">
                    No paid orders yet.
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

function ReportTable({
  title,
  rows,
  showMargin,
}: {
  title: string;
  rows: { key: string; count: number; totalMargin: number; totalCost: number; totalRevenue: number }[];
  showMargin: boolean;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-bone">{title}</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left text-xs uppercase text-ink-400">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2"># Items</th>
              <th className="px-4 py-2">Revenue</th>
              {showMargin && <th className="px-4 py-2">Margin</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-ink-800">
                <td className="px-4 py-2 text-bone">{r.key}</td>
                <td className="px-4 py-2 text-ink-300">{r.count}</td>
                <td className="px-4 py-2 text-bone">{formatMoney(r.totalRevenue)}</td>
                {showMargin && (
                  <td className={`px-4 py-2 ${r.totalMargin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatMoney(r.totalMargin)}
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={showMargin ? 4 : 3} className="px-4 py-6 text-center text-ink-500">
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
