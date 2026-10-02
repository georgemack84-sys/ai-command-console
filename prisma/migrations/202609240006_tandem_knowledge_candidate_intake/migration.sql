-- TD-N10/11: immutable Tandem-to-Nuru candidate intake receipts. A receipt is
-- evidence of a curation request, not canonical admission.
CREATE TABLE "TandemKnowledgeCandidateReceipt" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "missionId" TEXT NOT NULL,
  "curationProposalId" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload" JSONB NOT NULL,
  CONSTRAINT "TandemKnowledgeCandidateReceipt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TandemKnowledgeCandidateReceipt_workspaceId_candidateId_key" ON "TandemKnowledgeCandidateReceipt"("workspaceId", "candidateId");
CREATE INDEX "TandemKnowledgeCandidateReceipt_workspaceId_missionId_receivedAt_idx" ON "TandemKnowledgeCandidateReceipt"("workspaceId", "missionId", "receivedAt");
CREATE INDEX "TandemKnowledgeCandidateReceipt_curationProposalId_idx" ON "TandemKnowledgeCandidateReceipt"("curationProposalId");

CREATE OR REPLACE FUNCTION "tandem_knowledge_candidate_receipt_block_mutation"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Tandem knowledge candidate receipts are immutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "TandemKnowledgeCandidateReceipt_block_update" BEFORE UPDATE ON "TandemKnowledgeCandidateReceipt" FOR EACH ROW EXECUTE FUNCTION "tandem_knowledge_candidate_receipt_block_mutation"();
CREATE TRIGGER "TandemKnowledgeCandidateReceipt_block_delete" BEFORE DELETE ON "TandemKnowledgeCandidateReceipt" FOR EACH ROW EXECUTE FUNCTION "tandem_knowledge_candidate_receipt_block_mutation"();
