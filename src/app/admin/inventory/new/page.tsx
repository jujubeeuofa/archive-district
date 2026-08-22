import { requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createItem } from "../actions";
import PhotoUpload from "@/components/PhotoUpload";
import AdminNav from "@/components/AdminNav";
import { canSeeCost } from "@/lib/permissions";

export default async function NewItemPage() {
  const user = await requireStaff();
  const showCost = canSeeCost(user.role);

  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <AdminNav active="/admin/inventory" />
      <h1 className="text-2xl font-display uppercase text-bone">New inventory item</h1>

      <form action={createItem} className="card mt-6 max-w-2xl space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input className="input" id="title" name="title" required />
          </div>
          <div>
            <label className="label" htmlFor="brand">Brand</label>
            <input className="input" id="brand" name="brand" required defaultValue="Chrome Hearts" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">Category</label>
            <input className="input" id="category" name="category" required />
          </div>
          <div>
            <label className="label" htmlFor="condition">Condition</label>
            <input className="input" id="condition" name="condition" required placeholder="Excellent" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea className="input min-h-24" id="description" name="description" required />
        </div>

        <div className={`grid gap-4 ${showCost ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
          {showCost && (
            <div>
              <label className="label" htmlFor="costPrice">Cost price ($)</label>
              <input className="input" id="costPrice" name="costPrice" type="number" min="0" step="0.01" required />
            </div>
          )}
          <div>
            <label className="label" htmlFor="listPrice">List price ($)</label>
            <input className="input" id="listPrice" name="listPrice" type="number" min="0" step="0.01" required />
          </div>
        </div>
        {!showCost && (
          <p className="text-xs text-ink-500">
            Cost price isn&apos;t shown here — an Admin can set it from this item&apos;s edit page after it&apos;s created.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select className="input" id="status" name="status" defaultValue="IN_STOCK">
              <option value="IN_STOCK">In stock</option>
              <option value="HELD">Held</option>
              <option value="PENDING_INTAKE">Pending intake</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="source">Source</label>
            <select className="input" id="source" name="source" defaultValue="PURCHASED">
              <option value="PURCHASED">Purchased</option>
              <option value="CONSIGNED">Consigned</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="vendorId">Vendor</label>
          <select className="input" id="vendorId" name="vendorId" defaultValue="">
            <option value="">No vendor on record</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-ink-500">
          New items start Unverified. Save this item, then run its authenticity checklist from the
          item page before moving it to In stock.
        </p>

        <PhotoUpload name="photos" maxPhotos={8} />

        <button type="submit" className="btn-primary w-full">
          Create item
        </button>
      </form>
    </div>
  );
}
