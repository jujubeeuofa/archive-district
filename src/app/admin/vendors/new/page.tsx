import { requireStaff } from "@/lib/session";
import { createVendor } from "../actions";
import AdminNav from "@/components/AdminNav";

export default async function NewVendorPage() {
  await requireStaff();

  return (
    <div>
      <AdminNav active="/admin/vendors" />
      <h1 className="text-2xl font-display uppercase text-bone">Add vendor</h1>

      <form action={createVendor} className="card mt-6 max-w-lg space-y-4 p-6">
        <div>
          <label className="label" htmlFor="name">Vendor name</label>
          <input className="input" id="name" name="name" required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="contactName">Contact name</label>
            <input className="input" id="contactName" name="contactName" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input className="input" id="phone" name="phone" type="tel" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" />
        </div>

        <div>
          <label className="label" htmlFor="notes">Notes</label>
          <textarea className="input min-h-20" id="notes" name="notes" placeholder="How you found them, terms, anything worth remembering" />
        </div>

        <button type="submit" className="btn-primary w-full">
          Add vendor
        </button>
      </form>
    </div>
  );
}
