import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";

export default async function AdminVendorsPage() {
  await requireStaff();

  const vendors = await prisma.vendor.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <AdminNav active="/admin/vendors" />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display uppercase text-bone">Vendors</h1>
        <Link href="/admin/vendors/new" className="btn-primary">
          Add vendor
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-400">
        Suppliers you buy or consign inventory from. Link an item to a vendor from the item&apos;s
        edit page to track what came from where.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left text-xs uppercase text-ink-400">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Items supplied</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-t border-ink-800">
                <td className="px-4 py-2">
                  <Link href={`/admin/vendors/${v.id}`} className="text-bone hover:text-accent">
                    {v.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-ink-300">{v.contactName || "—"}</td>
                <td className="px-4 py-2 text-ink-300">{v.email || "—"}</td>
                <td className="px-4 py-2 text-ink-300">{v.phone || "—"}</td>
                <td className="px-4 py-2 text-ink-300">{v._count.items}</td>
              </tr>
            ))}
            {vendors.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-500">
                  No vendors yet — add one to start tracking where inventory comes from.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
