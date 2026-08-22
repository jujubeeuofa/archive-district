import { requireUser } from "@/lib/session";
import { computeOpenSlots, groupSlotsByDay, formatSlotTime } from "@/lib/appointments";
import { createAppointment } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Public-facing (but login-required — see middleware.ts) showroom booking
 * page. Slots come from computeOpenSlots(), which already excludes closed
 * days, past/too-soon times, and anything already booked — so every radio
 * option here is genuinely bookable the instant this page rendered. A slot
 * can still lose a race to another visitor between page load and submit;
 * createAppointment() re-checks server-side and just no-ops if so, which
 * shows up here as the slot silently no longer appearing after a refresh.
 */
export default async function BookPage() {
  await requireUser();

  const slots = await computeOpenSlots();
  const days = groupSlotsByDay(slots);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-display uppercase text-bone">Book a showroom visit</h1>
      <p className="mt-1 text-sm text-ink-400">
        Our showroom is by appointment only. Pick a time below and we&apos;ll see you then — no
        approval needed, it&apos;s confirmed as soon as you book it.
      </p>

      {days.length === 0 ? (
        <p className="card mt-6 p-5 text-sm text-ink-400">
          No open times in the next few weeks — check back soon, or reach out directly.
        </p>
      ) : (
        <form action={createAppointment} className="card mt-6 space-y-6 p-6">
          <div className="space-y-5">
            {days.map((day) => (
              <div key={day.key}>
                <p className="label mb-2">{day.label}</p>
                <div className="flex flex-wrap gap-2">
                  {day.slots.map((slot) => (
                    <label key={slot.startAt.toISOString()} className="cursor-pointer">
                      <input
                        type="radio"
                        name="startAt"
                        value={slot.startAt.toISOString()}
                        required
                        className="peer sr-only"
                      />
                      <span className="block rounded-lg border border-ink-600 px-3 py-1.5 text-sm text-ink-300 transition-colors peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                        {formatSlotTime(slot.startAt)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="label" htmlFor="note">Anything we should know? (optional)</label>
            <textarea
              className="input min-h-20"
              id="note"
              name="note"
              placeholder="e.g. interested in a specific piece, bringing a guest, etc."
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            Book appointment
          </button>
        </form>
      )}
    </div>
  );
}
