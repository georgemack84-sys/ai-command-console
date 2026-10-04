ALTER TABLE "NuruCurationSubmissionReceipt"
  ADD COLUMN "request" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "correlationId" TEXT;
