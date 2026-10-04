ALTER TABLE "NuruCurationProposal" ADD COLUMN "submissionReceiptId" TEXT;

DROP INDEX IF EXISTS "NuruCurationQueue_proposalId_idx";
CREATE UNIQUE INDEX "NuruCurationQueue_proposalId_key" ON "NuruCurationQueue"("proposalId");
CREATE UNIQUE INDEX "NuruCurationProposal_submissionReceiptId_key" ON "NuruCurationProposal"("submissionReceiptId");
