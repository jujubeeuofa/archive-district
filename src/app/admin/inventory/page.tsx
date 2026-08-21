import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, statusBadgeClass } from "@/lib/format";
import { computeMargin } from "@/lib/format";
import AdminNav from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: { status?: string; brand?: string; q?: string; authenticity?: string };
}) {
  await requireAdmin();

  const { status, brand, q, authenticity } = searchParams;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (brand) where.brand = brand;
  if (authenticity) where.authenticityStatus = authenticity;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { brand: { contains: q } },
      { category: { contains: q } },
    ];
  }

  const [items, brands] = await Promise.all([
    prisma.item.findMany({ where, orderBy: { createdAt: "desc" } }),
    prisma.item.findMany({ distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
  ]);

  function hrefWith(next: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { status, brand, q, authenticity, ...next };
    Object.entries(merged).forEach(([k, v]) => v && params.set(k, v));
    const qs = params.toString();
    return qs ? `/admin/inventory?${qs}` : "/admin/inventory";
  }

  const statuses = ["IN_STOCK", "SOLD", "HELD", "PENDING_INTAKE"];
  const authenticityOptions = ["UNVERIFIED", "AUTHENTICATED", "FLAGGED"];

  return (
    <div>
      <AdminNav active="/admin/inventory" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display uppercase text-bone">Inventory</h1>
        <Link href="/admin/inventory/new" className="btn-primary">
          + New item
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form className="flex gap-2" action="/admin/inventory">
          {status && <input type="hidden" name="status" value={status} />}
          {brand && <input type="hidden" name="brand" value={brand} />}
          <input
            className="input w-56"
            type="text"
            name="q"
            placeholder="Search title/brand/category"
            defaultValue={q}
          />
          <button className="btn-secondary" type="submit">
            Search
          </button>
        </form>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={hrefWith({ status: "" })}
          className={`badge ${!status ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
        >
          All statuses
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={hrefWith({ status: s })}
            className={`badge ${status === s ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href={hrefWith({ brand: "" })}
          className={`badge ${!brand ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
        >
          All brands
        </Link>
        {brands.map((b) => (
          <Link
            key={b.brand}
            href={hrefWith({ brand: b.brand })}
            className={`badge ${brand === b.brand ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
          >
            {b.brand}
          </Link>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href={hrefWith({ authenticity: "" })}
          className={`badge ${!authenticity ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
        >
          Any authenticity
        </Link>
        {authenticityOptions.map((a) => (
          <Link
            key={a}
            href={hrefWith({ authenticity: a })}
            className={`badge ${authenticity === a ? "border-accent text-accent" : "border-ink-600 text-ink-300"}`}
          >
            {a}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left text-xs uppercase text-ink-400">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Brand</th>
              <th className="px-4 py-2">Cost</th>
              <th className="px-4 py-2">List</th>
              <th className="px-4 py-2">Margin</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Authenticity</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const { margin } = computeMargin(item.costPrice, item.listPrice, item.soldPrice);
              return (
                <tr key={item.id} className="border-t border-ink-800 hover:bg-ink-900/50">
                  <td className="px-4 py-2">
                    <Link href={`/admin/inventory/${item.id}`} className="text-accent hover:text-accent-light">
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-ink-300">{item.brand}</td>
                  <td className="px-4 py-2">{formatMoney(item.costPrice)}</td>
                  <td className="px-4 py-2">{formatMoney(item.listPrice)}</td>
                  <td className={`px-4 py-2 ${margin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatMoney(margin)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`badge ${statusBadgeClass(item.status)}`}>{item.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`badge ${statusBadgeClass(item.authenticityStatus)}`}>
                      {item.authenticityStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-500">
                  No items match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
