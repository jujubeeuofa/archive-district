import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatApptDateTime } from "@/lib/appointments";
import { AppointmentStatus } from "@/lib/enums";
import { statusBadgeClass } from "@/lib/format";
import { canManageStaffAndSettings } from "@/lib/permissions";
import AdminNav from "@/components/AdminNav";
import { cancelAppointment, markAppointmentStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage() {
  const user = await requireStaff();

  const [upcoming, past] = await Promise.all([
    prisma.appointment.findMany({
      where: { status: AppointmentStatus.CONFIRMED, startAt: { gte: new Date() } },
      include: { client: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.appointment.findMany({
      where: { OR: [{ status: { not: AppointmentStatus.CONFIRMED } }, { startAt: { lt: new Date() } }] },
      include: { client: true },
      orderBy: { startAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <AdminNav active="/admin/appointments" />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display uppercase text-bone">Appointments</h1>
        {canManageStaffAndSettings(user.role) && (
          <Link href="/admin/appointments/settings" className="btn-secondary">
            Edit showroom hours →
          </Link>
        )}
      </div>

      <div className="mt-6">
        <p className="label mb-2">Upcoming</p>
        {upcoming.length === 0 ? (
          <p className="text-sm text-ink-500">No upcoming appointments.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((a) => (
              <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm text-bone">{formatApptDateTime(a.startAt)}</p>
                  <p className="text-xs text-ink-400">
                    {a.client.name} · {a.client.email}
                    {a.client.phone ? ` · ${a.client.phone}` : ""}
                  </p>
                  {a.note && <p className="mt-1 text-xs text-ink-500">{a.note}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <form action={markAppointmentStatus.bind(null, a.id)}>
                    <input type="hidden" name="status" value="COMPLETED" />
                    <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                      Mark completed
                    </button>
                  </form>
                  <form action={markAppointmentStatus.bind(null, a.id)}>
                    <input type="hidden" name="status" value="NO_SHOW" />
                    <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                      No-show
                    </button>
                  </form>
                  <form action={cancelAppointment.bind(null, a.id)}>
                    <button type="submit" className="btn-danger px-2 py-1 text-xs">
                      Cancel
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="label mb-2">Recent history</p>
        {past.length === 0 ? (
          <p className="text-sm text-ink-500">Nothing yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ink-700">
            <table className="w-full text-sm">
              <thead className="bg-ink-800 text-left text-xs uppercase text-ink-400">
                <tr>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">When</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {past.map((a) => (
                  <tr key={a.id} className="border-t border-ink-800">
                    <td className="px-4 py-2 text-ink-300">{a.client.name}</td>
                    <td className="px-4 py-2 text-ink-400">{formatApptDateTime(a.startAt)}</td>
                    <td className="px-4 py-2">
                      <span className={`badge ${statusBadgeClass(a.status)}`}>{a.status.replace("_", " ")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
