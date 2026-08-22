"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff, requireAdmin } from "@/lib/session";
import { AppointmentStatus } from "@/lib/enums";

export async function cancelAppointment(appointmentId: string) {
  await requireStaff();
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.CANCELED },
  });
  revalidatePath("/admin/appointments");
}

export async function markAppointmentStatus(appointmentId: string, formData: FormData) {
  await requireStaff();
  const status = String(formData.get("status") || "") as AppointmentStatus;
  const allowed: AppointmentStatus[] = [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW, AppointmentStatus.CONFIRMED];
  if (!allowed.includes(status)) return;

  await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });
  revalidatePath("/admin/appointments");
}

/** Admin-only: updates the weekly showroom hours + slot length. */
export async function updateAvailability(formData: FormData) {
  await requireAdmin();

  const slotMinutes = Number(formData.get("slotMinutes"));
  if (Number.isFinite(slotMinutes) && slotMinutes > 0) {
    await prisma.appointmentSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", slotMinutes },
      update: { slotMinutes },
    });
  }

  for (let day = 0; day <= 6; day++) {
    const isOpen = formData.get(`isOpen_${day}`) === "on";
    const openTime = String(formData.get(`openTime_${day}`) || "11:00");
    const closeTime = String(formData.get(`closeTime_${day}`) || "18:00");

    await prisma.appointmentAvailability.upsert({
      where: { dayOfWeek: day },
      create: { dayOfWeek: day, isOpen, openTime, closeTime },
      update: { isOpen, openTime, closeTime },
    });
  }

  revalidatePath("/admin/appointments/settings");
  revalidatePath("/book");
}
