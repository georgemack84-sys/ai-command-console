-- NURU-HF06: one immutable receipt per stabilized Headline Flow event version.
CREATE TABLE "NuruHeadlineFlowCandidate" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventVersion" INTEGER NOT NULL,
  "subjectId" TEXT NOT NULL,
  "developmentId" TEXT NOT NULL,
  "curationProposalId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruHeadlineFlowCandidate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NuruHeadlineFlowCandidate_workspaceId_eventId_eventVersion_key" ON "NuruHeadlineFlowCandidate"("workspaceId", "eventId", "eventVersion");
CREATE INDEX "NuruHeadlineFlowCandidate_workspaceId_subjectId_createdAt_idx" ON "NuruHeadlineFlowCandidate"("workspaceId", "subjectId", "createdAt");
CREATE INDEX "NuruHeadlineFlowCandidate_curationProposalId_idx" ON "NuruHeadlineFlowCandidate"("curationProposalId");

CREATE OR REPLACE FUNCTION "nuru_headline_flow_candidate_block_mutation"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'NuruHeadlineFlowCandidate receipts are append-only';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "NuruHeadlineFlowCandidate_block_update" BEFORE UPDATE ON "NuruHeadlineFlowCandidate" FOR EACH ROW EXECUTE FUNCTION "nuru_headline_flow_candidate_block_mutation"();
CREATE TRIGGER "NuruHeadlineFlowCandidate_block_delete" BEFORE DELETE ON "NuruHeadlineFlowCandidate" FOR EACH ROW EXECUTE FUNCTION "nuru_headline_flow_candidate_block_mutation"();
