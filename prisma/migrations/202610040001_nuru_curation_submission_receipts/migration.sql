CREATE TABLE "NuruCurationSubmissionReceipt" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROCESSING',
  "proposalId" TEXT,
  "queueId" TEXT,
  "result" JSONB NOT NULL DEFAULT '{}',
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruCurationSubmissionReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NuruCurationSubmissionReceipt_actorId_idempotencyKey_key"
  ON "NuruCurationSubmissionReceipt"("actorId", "idempotencyKey");
CREATE INDEX "NuruCurationSubmissionReceipt_status_updatedAt_idx"
  ON "NuruCurationSubmissionReceipt"("status", "updatedAt");
