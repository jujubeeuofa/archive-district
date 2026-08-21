import Link from "next/link";

const tabs = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/clients", label: "Clients" },
];

export default function AdminNav({ active }: { active: string }) {
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
