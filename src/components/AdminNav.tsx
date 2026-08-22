import Link from "next/link";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/permissions";

const STAFF_TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/consignments", label: "Consignments" },
];

/** Admin-only tab, appended after the staff tabs above. */
const ADMIN_ONLY_TAB = { href: "/admin/staff", label: "Staff" };

/**
 * Reads the session itself (rather than taking a role prop) so every admin
 * page can keep calling `<AdminNav active="..." />` unchanged — Sales sees
 * every section they have access to; the "Staff" tab (account management)
 * only ever shows for Admin.
 */
export default async function AdminNav({ active }: { active: string }) {
  const session = await getSession();
  const admin = !!session?.user && isAdmin(session.user.role);
  const tabs = admin ? [...STAFF_TABS, ADMIN_ONLY_TAB] : STAFF_TABS;

  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-ink-700 pb-px">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`rounded-t-lg px-3 py-2 text-sm ${
            active === t.href
              ? "border-b-2 border-accent text-bone"
              : "text-ink-400 hover:text-bone"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
