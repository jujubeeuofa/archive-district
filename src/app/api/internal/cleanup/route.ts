import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/enums";

/**
 * ONE-TIME production cleanup route: wipes every piece of seed/demo data
 * (all items, clients, vendors, orders, submissions, consignments, credit
 * transactions, messages) and creates a single real admin account from
 * ADMIN_EMAIL / ADMIN_PASSWORD.
 *
 * Guarded by INTERNAL_CLEANUP_SECRET (sent as the `x-internal-secret`
 * header) so it can't be hit by anyone who doesn't have that value. Same
 * pattern as the earlier temporary /api/internal/seed route: this file
 * should be deleted (and INTERNAL_CLEANUP_SECRET / ADMIN_EMAIL /
 * ADMIN_PASSWORD unset from Vercel) right after it's run once.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.INTERNAL_CLEANUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "INTERNAL_CLEANUP_SECRET is not set" }, { status: 500 });
  }
  if (req.headers.get("x-internal-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ error: "ADMIN_EMAIL / ADMIN_PASSWORD are not set" }, { status: 500 });
  }
  if (adminPassword.length < 8) {
    return NextResponse.json({ error: "ADMIN_PASSWORD must be at least 8 characters" }, { status: 500 });
  }

  const counts = await prisma.$transaction(async (tx) => {
    // Delete in dependency order (leaf tables first) so this works
    // regardless of each relation's onDelete setting.
    const message = await tx.message.deleteMany();
    const creditTransaction = await tx.creditTransaction.deleteMany();
    const authenticityCheck = await tx.authenticityCheck.deleteMany();
    const consignmentAgreement = await tx.consignmentAgreement.deleteMany();
    const orderItem = await tx.orderItem.deleteMany();
    const order = await tx.order.deleteMany();
    const photo = await tx.photo.deleteMany();
    const sellSubmission = await tx.sellSubmission.deleteMany();
    const item = await tx.item.deleteMany();
    const vendor = await tx.vendor.deleteMany();
    const pushSubscription = await tx.pushSubscription.deleteMany();
    const user = await tx.user.deleteMany();

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await tx.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
      },
    });

    return {
      message: message.count,
      creditTransaction: creditTransaction.count,
      authenticityCheck: authenticityCheck.count,
      consignmentAgreement: consignmentAgreement.count,
      orderItem: orderItem.count,
      order: order.count,
      photo: photo.count,
      sellSubmission: sellSubmission.count,
      item: item.count,
      vendor: vendor.count,
      pushSubscription: pushSubscription.count,
      user: user.count,
    };
  });

  return NextResponse.json({ ok: true, deleted: counts, adminEmail });
}
