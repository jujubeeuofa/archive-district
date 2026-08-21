import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { updateVendor, deleteVendor } from "../actions";
import AdminNav from "@/components/AdminNav";
import { formatMoney } from "@/lib/format";

export default async function VendorDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { createdAt: "desc" } } },
  });
  if (!vendor) notFound();

  const boundUpdate = updateVendor.bind(null, vendor.id);
  const boundDelete = deleteVendor.bind(null, vendor.id);
  const totalSpend = vendor.items.reduce((sum, item) => sum + item.costPrice, 0);

  return (
    <div>
      <AdminNav active="/admin/vendors" />

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-display uppercase text-bone">{vendor.name}</h1>
        <form action={boundDelete}>
          <button type="submit" className="btn-danger">
            Delete vendor
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <form action={boundUpdate} className="card space-y-4 p-6 lg:col-span-2">
          <div>
            <label className="label" htmlFor="name">Vendor name</label>
            <input className="input" id="name" name="name" defaultValue={vendor.name} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="contactName">Contact name</label>
              <input className="input" id="contactName" name="contactName" defaultValue={vendor.contactName ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone</label>
              <input className="input" id="phone" name="phone" type="tel" defaultValue={vendor.phone ?? ""} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" defaultValue={vendor.email ?? ""} />
          </div>

          <div>
            <label className="label" htmlFor="notes">Notes</label>
            <textarea className="input min-h-20" id="notes" name="notes" defaultValue={vendor.notes ?? ""} />
          </div>

          <button type="submit" className="btn-primary w-full">
            Save changes
          </button>
        </form>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="label">Total spend</p>
            <p className="mt-1 text-2xl font-semibold text-bone">{formatMoney(totalSpend)}</p>
            <p className="text-xs text-ink-400">
              Sum of cost price across {vendor.items.length} item{vendor.items.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="card p-5">
            <p className="label mb-2">Items from this vendor</p>
            {vendor.items.length === 0 ? (
              <p className="text-sm text-ink-500">None yet.</p>
            ) : (
              <ul className="space-y-2">
                {vendor.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/admin/inventory/${item.id}`} className="text-bone hover:text-accent">
                      {item.title}
                    </Link>
                    <span className="shrink-0 text-xs text-ink-400">{formatMoney(item.costPrice)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
