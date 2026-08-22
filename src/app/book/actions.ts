"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { getAppointmentSettings, bookAppointment, sendAppointmentConfirmationEmail, formatApptDateTime } from "@/lib/appointments";
import { notifyStaffOfBooking } from "@/lib/staffAlerts";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@/lib/enums";

export async function createAppointment(formData: FormData) {
  const user = await requireUser();

  const startAtRaw = String(formData.get("startAt") || "");
  const note = String(formData.get("note") || "").trim() || null;
  const startAt = new Date(startAtRaw);
  if (!startAtRaw || Number.isNaN(startAt.getTime()) || startAt.getTime() < Date.now()) return;

  const settings = await getAppointmentSettings();
  const endAt = new Date(startAt.getTime() + settings.slotMinutes * 60_000);

  const appointment = await bookAppointment(user.id, startAt, endAt, note);
  if (!appointment) return; // someone else took that slot first — booking page will show it's gone on reload

  const profile = await prisma.user.findUnique({ where: { id: user.id } });
  if (profile) {
    await sendAppointmentConfirmationEmail(profile, appointment).catch((err) => {
      console.error("Failed to send appointment confirmation email:", err);
    });
    await notifyStaffOfBooking(profile, formatApptDateTime(appointment.startAt)).catch((err) => {
      console.error("Failed to notify staff of new booking:", err);
    });
  }

  revalidatePath("/book");
  revalidatePath("/account");
  revalidatePath("/admin/appointments");
  redirect("/account");
}

/** A client canceling their own upcoming appointment, from /account. */
export async function cancelOwnAppointment(appointmentId: string) {
  const user = await requireUser();

  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment || appointment.clientId !== user.id) return;
  if (appointment.status !== AppointmentStatus.CONFIRMED) return;

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.CANCELED },
  });

  revalidatePath("/account");
  revalidatePath("/book");
  revalidatePath("/admin/appointments");
}
