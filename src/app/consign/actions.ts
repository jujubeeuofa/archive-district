"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ConsignmentStatus } from "@/lib/enums";

/**
 * Public — no auth. The consignor reaches this via a long random signToken
 * link, not a login, so anyone able to call this still needs the exact
 * token for the specific agreement (see generateSignToken in
 * src/lib/consignment.ts). Only agreements in DRAFT or SENT can still be
 * signed; already-SIGNED/DECLINED/VOIDED agreements are a no-op here (the
 * page itself won't show the form for those either).
 */
export async function signConsignmentAgreement(signToken: string, formData: FormData) {
  const agreement = await prisma.consignmentAgreement.findUnique({ where: { signToken } });
  if (!agreement) return;
  if (agreement.status !== ConsignmentStatus.DRAFT && agreement.status !== ConsignmentStatus.SENT) return;

  const signerName = String(formData.get("signerName") || "").trim();
  const agreed = formData.get("agree") === "on";
  if (!signerName || !agreed) return;

  const forwardedFor = headers().get("x-forwarded-for");
  const signerIp = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

  await prisma.consignmentAgreement.update({
    where: { signToken },
    data: {
      status: ConsignmentStatus.SIGNED,
      signerName,
      signedAt: new Date(),
      signerIp,
      contractSnapshot: agreement.contractTerms,
    },
  });

  revalidatePath(`/consign/sign/${signToken}`);
  revalidatePath(`/admin/consignments/${agreement.id}`);
  revalidatePath("/admin/consignments");
}

export async function declineConsignmentAgreement(signToken: string) {
  const agreement = await prisma.consignmentAgreement.findUnique({ where: { signToken } });
  if (!agreement) return;
  if (agreement.status !== ConsignmentStatus.DRAFT && agreement.status !== ConsignmentStatus.SENT) return;

  await prisma.consignmentAgreement.update({
    where: { signToken },
    data: { status: ConsignmentStatus.DECLINED },
  });

  revalidatePath(`/consign/sign/${signToken}`);
  revalidatePath(`/admin/consignments/${agreement.id}`);
  revalidatePath("/admin/consignments");
}
