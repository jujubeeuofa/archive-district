-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "creditApplied" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SellSubmission" ADD COLUMN     "payoutType" TEXT NOT NULL DEFAULT 'CASH';

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT,
    "sellSubmissionId" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsignmentAgreement" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "consignorName" TEXT NOT NULL,
    "consignorEmail" TEXT,
    "consignorPhone" TEXT,
    "consignorSplitPct" DOUBLE PRECISION NOT NULL,
    "listPrice" DOUBLE PRECISION NOT NULL,
    "floorPrice" DOUBLE PRECISION,
    "contractTerms" TEXT NOT NULL,
    "contractSnapshot" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "signToken" TEXT NOT NULL,
    "signerName" TEXT,
    "signedAt" TIMESTAMP(3),
    "signerIp" TEXT,
    "payoutStatus" TEXT NOT NULL DEFAULT 'NOT_YET_SOLD',
    "payoutAmount" DOUBLE PRECISION,
    "paidAt" TIMESTAMP(3),
    "paidNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsignmentAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsignmentAgreement_itemId_key" ON "ConsignmentAgreement"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsignmentAgreement_signToken_key" ON "ConsignmentAgreement"("signToken");

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_sellSubmissionId_fkey" FOREIGN KEY ("sellSubmissionId") REFERENCES "SellSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentAgreement" ADD CONSTRAINT "ConsignmentAgreement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
