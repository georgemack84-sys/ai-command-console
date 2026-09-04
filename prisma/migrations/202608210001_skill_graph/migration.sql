CREATE TABLE "SkillNode" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT NOT NULL,
  "status" TEXT NOT NULL, "modelVersion" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SkillNode_pkey" PRIMARY KEY ("id"));
CREATE TABLE "SkillEdge" ("id" TEXT NOT NULL, "fromSkillId" TEXT NOT NULL, "toSkillId" TEXT NOT NULL, "type" TEXT NOT NULL, "strength" DOUBLE PRECISION, "rationale" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SkillEdge_pkey" PRIMARY KEY ("id"));
CREATE TABLE "SkillEvidence" ("id" TEXT NOT NULL, "learnerId" TEXT NOT NULL, "skillId" TEXT NOT NULL, "kind" TEXT NOT NULL, "occurredAt" TIMESTAMP(3) NOT NULL, "score" DOUBLE PRECISION, "outcome" TEXT NOT NULL, "evaluator" TEXT NOT NULL, "sourceRef" TEXT, "notes" TEXT, "rubricVersion" TEXT, CONSTRAINT "SkillEvidence_pkey" PRIMARY KEY ("id"));
CREATE TABLE "SkillLearnerState" ("id" TEXT NOT NULL, "learnerId" TEXT NOT NULL, "skillId" TEXT NOT NULL, "mastery" DOUBLE PRECISION, "confidence" DOUBLE PRECISION NOT NULL, "retentionScore" DOUBLE PRECISION, "lastEvaluated" TIMESTAMP(3), "displayState" TEXT NOT NULL, "calculationVersion" TEXT NOT NULL, "calculatedAt" TIMESTAMP(3) NOT NULL, "evidenceIds" TEXT[] NOT NULL, CONSTRAINT "SkillLearnerState_pkey" PRIMARY KEY ("id"));
CREATE TABLE "SkillRecommendationEvent" ("id" TEXT NOT NULL, "learnerId" TEXT NOT NULL, "targetSkillId" TEXT, "blockedSkillId" TEXT NOT NULL, "outcome" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SkillRecommendationEvent_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "SkillNode_slug_key" ON "SkillNode"("slug");
CREATE UNIQUE INDEX "SkillEdge_fromSkillId_toSkillId_type_key" ON "SkillEdge"("fromSkillId", "toSkillId", "type");
CREATE INDEX "SkillEvidence_learnerId_skillId_occurredAt_idx" ON "SkillEvidence"("learnerId", "skillId", "occurredAt");
CREATE UNIQUE INDEX "SkillLearnerState_learnerId_skillId_key" ON "SkillLearnerState"("learnerId", "skillId");
CREATE INDEX "SkillRecommendationEvent_learnerId_createdAt_idx" ON "SkillRecommendationEvent"("learnerId", "createdAt");
ALTER TABLE "SkillEdge" ADD CONSTRAINT "SkillEdge_fromSkillId_fkey" FOREIGN KEY ("fromSkillId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillEdge" ADD CONSTRAINT "SkillEdge_toSkillId_fkey" FOREIGN KEY ("toSkillId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillLearnerState" ADD CONSTRAINT "SkillLearnerState_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillLearnerState" ADD CONSTRAINT "SkillLearnerState_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillRecommendationEvent" ADD CONSTRAINT "SkillRecommendationEvent_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
