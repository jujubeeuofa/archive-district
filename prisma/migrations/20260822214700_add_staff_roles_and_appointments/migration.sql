-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AppointmentAvailability" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,

    CONSTRAINT "AppointmentAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "slotMinutes" INTEGER NOT NULL DEFAULT 45,

    CONSTRAINT "AppointmentSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentAvailability_dayOfWeek_key" ON "AppointmentAvailability"("dayOfWeek");

-- CreateIndex
CREATE INDEX "Appointment_startAt_idx" ON "Appointment"("startAt");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default weekly showroom hours: closed Sun/Mon, open Tue–Sat.
-- Purely a starting point — edit anytime from /admin/appointments/settings.
INSERT INTO "AppointmentAvailability" ("id", "dayOfWeek", "isOpen", "openTime", "closeTime") VALUES
  ('appt-avail-sun', 0, false, '11:00', '18:00'),
  ('appt-avail-mon', 1, false, '11:00', '18:00'),
  ('appt-avail-tue', 2, true,  '11:00', '18:00'),
  ('appt-avail-wed', 3, true,  '11:00', '18:00'),
  ('appt-avail-thu', 4, true,  '11:00', '18:00'),
  ('appt-avail-fri', 5, true,  '11:00', '18:00'),
  ('appt-avail-sat', 6, true,  '11:00', '17:00');

-- Seed the singleton settings row (id is fixed at "singleton" in the schema
-- default, but INSERT still needs it spelled out explicitly here).
INSERT INTO "AppointmentSettings" ("id", "slotMinutes") VALUES ('singleton', 45);
