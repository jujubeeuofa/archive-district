import { prisma } from "@/lib/prisma";

/**
 * A customer's trade-in credit balance — always computed as the sum of
 * their CreditTransaction ledger, never stored as its own field. Same
 * "compute, don't store" approach as computeMargin() in lib/format.ts.
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const result = await prisma.creditTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}
