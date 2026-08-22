import { requireAdmin } from "@/lib/session";
import { getAppointmentSettings, getWeeklyAvailability } from "@/lib/appointments";
import { WEEKDAY_LABELS } from "@/lib/enums";
import AdminNav from "@/components/AdminNav";
import { updateAvailability } from "../actions";

export default async function AppointmentSettingsPage() {
  await requireAdmin();

  const [settings, availability] = await Promise.all([getAppointmentSettings(), getWeeklyAvailability()]);
  const byDay = new Map(availability.map((a) => [a.dayOfWeek, a]));

  return (
    <div>
      <AdminNav active="/admin/appointments" />
      <h1 className="text-2xl font-display uppercase text-bone">Showroom hours</h1>
      <p className="mt-1 text-sm text-ink-400">
        Sets the recurring weekly hours clients can book from on{" "}
        <a href="/book" className="text-accent hover:text-accent-light">/book</a>, and how long each
        appointment slot is. Times are showroom-local (Phoenix).
      </p>

      <form action={updateAvailability} className="card mt-6 max-w-2xl space-y-5 p-6">
        <div>
          <label className="label" htmlFor="slotMinutes">Slot length (minutes)</label>
          <input
            className="input max-w-[10rem]"
            id="slotMinutes"
            name="slotMinutes"
            type="number"
            min={5}
            step={5}
            defaultValue={settings.slotMinutes}
            required
          />
        </div>

        <div className="space-y-3 border-t border-ink-700 pt-4">
          {WEEKDAY_LABELS.map((label, day) => {
            const avail = byDay.get(day);
            return (
              <div key={day} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-bone">
                  <input type="checkbox" name={`isOpen_${day}`} defaultChecked={avail?.isOpen ?? false} />
                  {label}
                </label>
                <span />
                <input
                  className="input"
                  type="time"
                  name={`openTime_${day}`}
                  defaultValue={avail?.openTime ?? "11:00"}
                />
                <input
                  className="input"
                  type="time"
                  name={`closeTime_${day}`}
                  defaultValue={avail?.closeTime ?? "18:00"}
                />
              </div>
            );
          })}
        </div>

        <button type="submit" className="btn-primary w-full">
          Save hours
        </button>
      </form>
    </div>
  );
}
