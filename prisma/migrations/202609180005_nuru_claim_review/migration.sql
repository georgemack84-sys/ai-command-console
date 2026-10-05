-- NSI-13/14: human review governs candidates without turning them into knowledge.
ALTER TABLE "NuruClaimCandidate" ADD COLUMN "reviewedBy" TEXT;
ALTER TABLE "NuruClaimCandidate" ADD COLUMN "reviewReason" TEXT;
ALTER TABLE "NuruClaimCandidate" ADD COLUMN "reviewedAt" TIMESTAMP(3);
