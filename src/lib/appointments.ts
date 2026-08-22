import { prisma } from "@/lib/prisma";
import { sendEmail, escapeHtml } from "@/lib/email";
import { AppointmentStatus } from "@/lib/enums";

/**
 * The showroom is in Arizona, which (outside the Navajo Nation) doesn't
 * observe DST — America/Phoenix is a fixed UTC-7 year round. That fixed
 * offset lets us convert a "wall clock" showroom time to/from a real UTC
 * instant with plain arithmetic instead of a timezone database, while still
 * always being correct. Display formatting below uses the real IANA zone
 * name instead, so it renders correctly regardless of this file's own math.
 */
const PHX_OFFSET_MS = 7 * 60 * 60 * 1000;
const PHX_TIME_ZONE = "America/Phoenix";

const BOOKING_WINDOW_DAYS = 21;
const MIN_LEAD_HOURS = 2;

export type OpenSlot = { startAt: Date; endAt: Date };

export async function getAppointmentSettings() {
  const settings = await prisma.appointmentSettings.findUnique({ where: { id: "singleton" } });
  return settings ?? { id: "singleton", slotMinutes: 45 };
}

export async function getWeeklyAvailability() {
  return prisma.appointmentAvailability.findMany({ orderBy: { dayOfWeek: "asc" } });
}

/** A Date whose UTC fields equal Phoenix's current wall-clock fields — a convenient basis for day math below. */
function phxNowAsUtcFields(): Date {
  return new Date(Date.now() - PHX_OFFSET_MS);
}

/** Converts a Phoenix wall-clock time (date's UTC Y/M/D + hh:mm) into the real UTC instant it represents. */
function phxWallTimeToUtc(dateWithPhxFields: Date, hh: number, mm: number): Date {
  return new Date(
    Date.UTC(
      dateWithPhxFields.getUTCFullYear(),
      dateWithPhxFields.getUTCMonth(),
      dateWithPhxFields.getUTCDate(),
      hh,
      mm,
      0,
      0
    ) + PHX_OFFSET_MS
  );
}

/**
 * Computes open, unbooked appointment slots for the next BOOKING_WINDOW_DAYS
 * days, based on weekly hours + slot length, minus anything already
 * CONFIRMED. Slots less than MIN_LEAD_HOURS away are excluded so no one can
 * book a visit that's about to start (or already started).
 */
export async function computeOpenSlots(): Promise<OpenSlot[]> {
  const [settings, availability, existing] = await Promise.all([
    getAppointmentSettings(),
    getWeeklyAvailability(),
    prisma.appointment.findMany({
      where: { status: AppointmentStatus.CONFIRMED, startAt: { gte: new Date() } },
      select: { startAt: true, endAt: true },
    }),
  ]);

  const byDay = new Map(availability.filter((a) => a.isOpen).map((a) => [a.dayOfWeek, a]));
  const slotMs = settings.slotMinutes * 60_000;
  const earliest = new Date(Date.now() + MIN_LEAD_HOURS * 60 * 60 * 1000);
  const base = phxNowAsUtcFields();

  const slots: OpenSlot[] = [];
  for (let d = 0; d < BOOKING_WINDOW_DAYS; d++) {
    const day = new Date(base);
    day.setUTCDate(day.getUTCDate() + d);
    const avail = byDay.get(day.getUTCDay());
    if (!avail) continue;

    const [openH, openM] = avail.openTime.split(":").map(Number);
    const [closeH, closeM] = avail.closeTime.split(":").map(Number);
    const dayStart = phxWallTimeToUtc(day, openH, openM);
    const dayClose = phxWallTimeToUtc(day, closeH, closeM);

    for (let t = dayStart.getTime(); t + slotMs <= dayClose.getTime(); t += slotMs) {
      if (t < earliest.getTime()) continue;
      const startAt = new Date(t);
      const endAt = new Date(t + slotMs);
      const overlaps = existing.some((e) => startAt < e.endAt && endAt > e.startAt);
      if (overlaps) continue;
      slots.push({ startAt, endAt });
    }
  }
  return slots;
}

/** Groups open slots by Phoenix calendar day, for rendering a day-by-day picker. */
export function groupSlotsByDay(slots: OpenSlot[]): { key: string; label: string; slots: OpenSlot[] }[] {
  const groups = new Map<string, OpenSlot[]>();
  for (const slot of slots) {
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: PHX_TIME_ZONE }).format(slot.startAt); // YYYY-MM-DD, stable sort key
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(slot);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, daySlots]) => ({
      key,
      label: new Intl.DateTimeFormat("en-US", {
        timeZone: PHX_TIME_ZONE,
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(daySlots[0].startAt),
      slots: daySlots,
    }));
}

export function formatSlotTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PHX_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatApptDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PHX_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/** Re-checks the slot is still free and creates the appointment inside a transaction, guarding the race between two people booking the same slot. */
export async function bookAppointment(
  clientId: string,
  startAt: Date,
  endAt: Date,
  note: string | null
) {
  return prisma.$transaction(async (tx) => {
    const conflict = await tx.appointment.findFirst({
      where: {
        status: AppointmentStatus.CONFIRMED,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    if (conflict) return null;

    return tx.appointment.create({
      data: { clientId, startAt, endAt, note, status: AppointmentStatus.CONFIRMED },
    });
  });
}

export async function sendAppointmentConfirmationEmail(
  user: { name: string; email: string },
  appointment: { startAt: Date; note: string | null }
) {
  const when = formatApptDateTime(appointment.startAt);
  await sendEmail({
    to: user.email,
    subject: "Your Archive District showroom appointment is confirmed",
    html: `
      <p>Hi ${escapeHtml(user.name)},</p>
      <p>Your showroom visit is confirmed for <strong>${when}</strong> (Phoenix time).</p>
      ${appointment.note ? `<p>Your note: ${escapeHtml(appointment.note)}</p>` : ""}
      <p>Need to reschedule or cancel? Sign in and visit your account page.</p>
      <p>— Archive District</p>
    `,
  });
}
