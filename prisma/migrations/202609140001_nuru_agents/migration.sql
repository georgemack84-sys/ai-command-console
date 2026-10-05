CREATE TABLE "NuruKnowledgeItem" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'READY_FOR_REVIEW',
  "project" TEXT,
  "source" JSONB NOT NULL,
  "sourceId" TEXT,
  "metadata" JSONB NOT NULL,
  "relationships" JSONB NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "currentVersion" INTEGER NOT NULL DEFAULT 1,
  "provenance" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruKnowledgeItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NuruCurationProposal" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  "classification" TEXT NOT NULL,
  "project" TEXT,
  "qualityStatus" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "evidence" JSONB NOT NULL,
  "reasoningSummary" TEXT NOT NULL,
  "warnings" JSONB NOT NULL,
  "requiredReview" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT NOT NULL DEFAULT 'HUMAN_REVIEW_REQUIRED',
  "createdBy" TEXT NOT NULL,
  "decisionReason" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruCurationProposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NuruAgentRun" (
  "id" TEXT NOT NULL, "proposalId" TEXT, "agentId" TEXT NOT NULL, "agentType" TEXT NOT NULL,
  "status" TEXT NOT NULL, "objective" TEXT NOT NULL, "result" JSONB NOT NULL, "correlationId" TEXT NOT NULL,
  "model" TEXT NOT NULL, "promptVersion" TEXT NOT NULL, "policyVersion" TEXT NOT NULL, "durationMs" INTEGER, "tokenUsage" INTEGER NOT NULL DEFAULT 0, "toolUsage" JSONB NOT NULL DEFAULT '[]', "modelCost" DOUBLE PRECISION NOT NULL DEFAULT 0, "retryCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "NuruAgentRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NuruAuditEvent" (
  "id" TEXT NOT NULL, "proposalId" TEXT, "eventType" TEXT NOT NULL, "actor" TEXT NOT NULL,
  "agentRunId" TEXT, "resourceId" TEXT NOT NULL, "inputReference" TEXT, "outputReference" TEXT, "decision" TEXT, "reason" TEXT, "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "NuruAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NuruSource" (
  "id" TEXT NOT NULL, "sourceType" TEXT NOT NULL, "origin" TEXT NOT NULL, "uri" TEXT, "author" TEXT,
  "authority" TEXT NOT NULL, "checksum" TEXT, "version" TEXT, "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "NuruSource_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NuruDiscoveryCandidate" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "content" TEXT NOT NULL, "source" JSONB NOT NULL,
  "reasonDiscovered" TEXT NOT NULL, "initialType" TEXT NOT NULL, "relevanceScore" INTEGER NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL, "status" TEXT NOT NULL DEFAULT 'CANDIDATE', "createdBy" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruDiscoveryCandidate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NuruContextAssessment" (
  "id" TEXT NOT NULL, "candidateId" TEXT NOT NULL, "project" TEXT, "topic" TEXT NOT NULL, "artifactType" TEXT NOT NULL,
  "scope" TEXT NOT NULL, "sourceContext" TEXT NOT NULL, "likelyPurpose" TEXT NOT NULL, "dependencies" JSONB NOT NULL,
  "applicableSystem" TEXT, "historicalContext" TEXT, "relatedComponents" JSONB NOT NULL, "confidence" DOUBLE PRECISION NOT NULL,
  "createdBy" TEXT NOT NULL, "correlationId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruContextAssessment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NuruQualityAssessment" (
  "id" TEXT NOT NULL, "itemId" TEXT NOT NULL, "status" TEXT NOT NULL, "sourceKnown" BOOLEAN NOT NULL,
  "provenanceAvailable" BOOLEAN NOT NULL, "duplicateState" TEXT NOT NULL, "conflictDetected" BOOLEAN NOT NULL,
  "contextAccurate" BOOLEAN NOT NULL, "relationshipsJustified" BOOLEAN NOT NULL, "evidenceSufficient" BOOLEAN NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL, "warnings" JSONB NOT NULL, "createdBy" TEXT NOT NULL, "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "NuruQualityAssessment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NuruMetadataRecord" (
  "id" TEXT NOT NULL, "itemId" TEXT NOT NULL, "key" TEXT NOT NULL, "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "NuruMetadataRecord_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NuruRelationship" (
  "id" TEXT NOT NULL, "sourceItemId" TEXT NOT NULL, "targetItemId" TEXT NOT NULL, "relationshipType" TEXT NOT NULL, "confidence" DOUBLE PRECISION NOT NULL, "evidence" TEXT NOT NULL, "proposedBy" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PROPOSED', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "NuruRelationship_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NuruCurationDecision" (
  "id" TEXT NOT NULL, "proposalId" TEXT NOT NULL, "outcome" TEXT NOT NULL, "decidedBy" TEXT NOT NULL, "reason" TEXT NOT NULL, "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "NuruCurationDecision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NuruEmbeddingReference" (
  "id" TEXT NOT NULL, "itemId" TEXT NOT NULL, "provider" TEXT NOT NULL, "model" TEXT NOT NULL, "externalRef" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "NuruEmbeddingReference_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NuruKnowledgeItem_status_createdAt_idx" ON "NuruKnowledgeItem"("status", "createdAt");
CREATE INDEX "NuruKnowledgeItem_sourceId_idx" ON "NuruKnowledgeItem"("sourceId");
CREATE INDEX "NuruCurationProposal_status_createdAt_idx" ON "NuruCurationProposal"("status", "createdAt");
CREATE INDEX "NuruAgentRun_proposalId_createdAt_idx" ON "NuruAgentRun"("proposalId", "createdAt");
CREATE INDEX "NuruAuditEvent_resourceId_createdAt_idx" ON "NuruAuditEvent"("resourceId", "createdAt");
CREATE INDEX "NuruAuditEvent_proposalId_createdAt_idx" ON "NuruAuditEvent"("proposalId", "createdAt");
CREATE INDEX "NuruSource_checksum_idx" ON "NuruSource"("checksum");
CREATE INDEX "NuruDiscoveryCandidate_status_createdAt_idx" ON "NuruDiscoveryCandidate"("status", "createdAt");
CREATE INDEX "NuruDiscoveryCandidate_correlationId_idx" ON "NuruDiscoveryCandidate"("correlationId");
CREATE INDEX "NuruContextAssessment_candidateId_createdAt_idx" ON "NuruContextAssessment"("candidateId", "createdAt");
CREATE INDEX "NuruContextAssessment_correlationId_idx" ON "NuruContextAssessment"("correlationId");
CREATE INDEX "NuruQualityAssessment_itemId_createdAt_idx" ON "NuruQualityAssessment"("itemId", "createdAt");
CREATE INDEX "NuruQualityAssessment_correlationId_idx" ON "NuruQualityAssessment"("correlationId");
CREATE INDEX "NuruSource_origin_idx" ON "NuruSource"("origin");
CREATE UNIQUE INDEX "NuruMetadataRecord_itemId_key_key" ON "NuruMetadataRecord"("itemId", "key");
CREATE INDEX "NuruRelationship_sourceItemId_status_idx" ON "NuruRelationship"("sourceItemId", "status");
CREATE INDEX "NuruRelationship_targetItemId_status_idx" ON "NuruRelationship"("targetItemId", "status");
CREATE INDEX "NuruCurationDecision_proposalId_decidedAt_idx" ON "NuruCurationDecision"("proposalId", "decidedAt");
CREATE UNIQUE INDEX "NuruEmbeddingReference_provider_externalRef_key" ON "NuruEmbeddingReference"("provider", "externalRef");
CREATE INDEX "NuruEmbeddingReference_itemId_idx" ON "NuruEmbeddingReference"("itemId");
ALTER TABLE "NuruCurationProposal" ADD CONSTRAINT "NuruCurationProposal_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "NuruKnowledgeItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NuruAgentRun" ADD CONSTRAINT "NuruAgentRun_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "NuruCurationProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NuruAuditEvent" ADD CONSTRAINT "NuruAuditEvent_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "NuruCurationProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NuruKnowledgeItem" ADD CONSTRAINT "NuruKnowledgeItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NuruSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NuruMetadataRecord" ADD CONSTRAINT "NuruMetadataRecord_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "NuruKnowledgeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NuruRelationship" ADD CONSTRAINT "NuruRelationship_sourceItemId_fkey" FOREIGN KEY ("sourceItemId") REFERENCES "NuruKnowledgeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NuruRelationship" ADD CONSTRAINT "NuruRelationship_targetItemId_fkey" FOREIGN KEY ("targetItemId") REFERENCES "NuruKnowledgeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NuruCurationDecision" ADD CONSTRAINT "NuruCurationDecision_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "NuruCurationProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NuruEmbeddingReference" ADD CONSTRAINT "NuruEmbeddingReference_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "NuruKnowledgeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
