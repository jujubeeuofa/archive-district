import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/enums";
import { formatDate } from "@/lib/format";
import AdminNav from "@/components/AdminNav";
import { createStaffUser, toggleStaffActive, setStaffRole } from "./actions";

export default async function AdminStaffPage() {
  const me = await requireAdmin();

  const staff = await prisma.user.findMany({
    where: { role: { in: [Role.ADMIN, Role.SALES] } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <AdminNav active="/admin/staff" />
      <h1 className="text-2xl font-display uppercase text-bone">Staff accounts</h1>
      <p className="mt-1 text-sm text-ink-400">
        Admin has full access everywhere. Sales can run day-to-day operations across the shop but
        can&apos;t delete anything, can&apos;t commit the shop to a consignment deal, can&apos;t
        adjust store credit, and never sees item cost price or margin.
      </p>

      <div className="mt-6 card max-w-xl space-y-4 p-6">
        <p className="label">Add a staff account</p>
        <form action={createStaffUser} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input className="input" id="name" name="name" required />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input className="input" id="email" name="email" type="email" required />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="password">Temporary password</label>
              <input className="input" id="password" name="password" type="text" minLength={8} required />
              <p className="mt-1 text-xs text-ink-500">At least 8 characters. Share it with them directly — there&apos;s no invite email yet.</p>
            </div>
            <div>
              <label className="label" htmlFor="role">Role</label>
              <select className="input" id="role" name="role" defaultValue={Role.SALES}>
                <option value={Role.SALES}>Sales</option>
                <option value={Role.ADMIN}>Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone (optional)</label>
            <input className="input" id="phone" name="phone" type="tel" placeholder="For SMS alerts — they can add this later too" />
          </div>
          <button type="submit" className="btn-primary w-full">
            Create staff account
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-ink-400">
        Each staff member controls their own alert preferences (email/SMS for new bookings, sell
        submissions, and purchases) from the <span className="text-bone">Dashboard</span> tab.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left text-xs uppercase text-ink-400">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Joined</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const isSelf = s.id === me.id;
              return (
                <tr key={s.id} className="border-t border-ink-800">
                  <td className="px-4 py-2 text-bone">
                    {s.name} {isSelf && <span className="text-xs text-ink-500">(you)</span>}
                  </td>
                  <td className="px-4 py-2 text-ink-300">{s.email}</td>
                  <td className="px-4 py-2">
                    <form action={setStaffRole.bind(null, s.id)} className="flex items-center gap-2">
                      <select className="input py-1 text-xs" name="role" defaultValue={s.role} disabled={isSelf}>
                        <option value={Role.SALES}>Sales</option>
                        <option value={Role.ADMIN}>Admin</option>
                      </select>
                      {!isSelf && (
                        <button type="submit" className="btn-secondary shrink-0 px-2 py-1 text-xs">
                          Save
                        </button>
                      )}
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`badge ${s.active ? "border-emerald-700 text-emerald-400" : "border-ink-600 text-ink-400"}`}>
                      {s.active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-ink-400">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-2">
                    {isSelf ? (
                      <span className="text-xs text-ink-500">—</span>
                    ) : (
                      <form action={toggleStaffActive.bind(null, s.id)}>
                        <button type="submit" className={s.active ? "btn-danger px-2 py-1 text-xs" : "btn-secondary px-2 py-1 text-xs"}>
                          {s.active ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
