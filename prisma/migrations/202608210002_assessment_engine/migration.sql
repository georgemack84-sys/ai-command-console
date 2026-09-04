ALTER TABLE "SkillEvidence"
  ADD COLUMN "assessmentSessionId" TEXT,
  ADD COLUMN "assessmentItemId" TEXT,
  ADD COLUMN "evaluationType" TEXT,
  ADD COLUMN "competencyDimensions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "AssessmentBlueprint" (
  "id" TEXT NOT NULL, "skillId" TEXT NOT NULL, "version" TEXT NOT NULL,
  "objectives" JSONB NOT NULL, "targetCompetencies" TEXT[] NOT NULL,
  "itemMix" JSONB NOT NULL, "rules" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentBlueprint_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssessmentItem" (
  "id" TEXT NOT NULL, "skillId" TEXT NOT NULL, "blueprintId" TEXT,
  "evaluationType" TEXT NOT NULL, "prompt" TEXT NOT NULL,
  "expectedResponseFormat" TEXT NOT NULL, "rubric" JSONB NOT NULL,
  "difficulty" INTEGER NOT NULL, "version" TEXT NOT NULL,
  "competencyDimensions" TEXT[] NOT NULL, "content" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssessmentSession" (
  "id" TEXT NOT NULL, "learnerId" TEXT NOT NULL, "blueprintId" TEXT NOT NULL,
  "targetSkillIds" TEXT[] NOT NULL, "state" TEXT NOT NULL, "blueprintVersion" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentSession_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssessmentResponse" (
  "id" TEXT NOT NULL, "sessionId" TEXT NOT NULL, "itemId" TEXT NOT NULL,
  "answer" JSONB NOT NULL, "selfRatedConfidence" DOUBLE PRECISION,
  "evaluationResult" JSONB, "feedback" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentResponse_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CompetencyProfile" (
  "id" TEXT NOT NULL, "sessionId" TEXT NOT NULL, "learnerId" TEXT NOT NULL, "skillId" TEXT NOT NULL,
  "knowledge" DOUBLE PRECISION, "application" DOUBLE PRECISION, "troubleshooting" DOUBLE PRECISION,
  "retention" DOUBLE PRECISION, "calibration" DOUBLE PRECISION, "score" DOUBLE PRECISION,
  "confidenceInterval" JSONB NOT NULL, "evidenceCount" INTEGER NOT NULL,
  "calculationVersion" TEXT NOT NULL, "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompetencyProfile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssessmentRecommendation" (
  "id" TEXT NOT NULL, "sessionId" TEXT NOT NULL, "learnerId" TEXT NOT NULL,
  "instructionalStartingPoint" TEXT NOT NULL, "priorityGaps" JSONB NOT NULL, "retestAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentBlueprint_skillId_version_key" ON "AssessmentBlueprint"("skillId", "version");
CREATE INDEX "AssessmentItem_skillId_evaluationType_version_idx" ON "AssessmentItem"("skillId", "evaluationType", "version");
CREATE INDEX "AssessmentItem_blueprintId_idx" ON "AssessmentItem"("blueprintId");
CREATE INDEX "AssessmentSession_learnerId_state_idx" ON "AssessmentSession"("learnerId", "state");
CREATE UNIQUE INDEX "AssessmentResponse_sessionId_itemId_key" ON "AssessmentResponse"("sessionId", "itemId");
CREATE INDEX "AssessmentResponse_itemId_idx" ON "AssessmentResponse"("itemId");
CREATE UNIQUE INDEX "CompetencyProfile_sessionId_skillId_key" ON "CompetencyProfile"("sessionId", "skillId");
CREATE INDEX "CompetencyProfile_learnerId_skillId_calculatedAt_idx" ON "CompetencyProfile"("learnerId", "skillId", "calculatedAt");
CREATE UNIQUE INDEX "AssessmentRecommendation_sessionId_key" ON "AssessmentRecommendation"("sessionId");
CREATE INDEX "AssessmentRecommendation_learnerId_createdAt_idx" ON "AssessmentRecommendation"("learnerId", "createdAt");
CREATE INDEX "SkillEvidence_assessmentSessionId_idx" ON "SkillEvidence"("assessmentSessionId");
CREATE INDEX "SkillEvidence_assessmentItemId_idx" ON "SkillEvidence"("assessmentItemId");

ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_assessmentSessionId_fkey" FOREIGN KEY ("assessmentSessionId") REFERENCES "AssessmentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_assessmentItemId_fkey" FOREIGN KEY ("assessmentItemId") REFERENCES "AssessmentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentBlueprint" ADD CONSTRAINT "AssessmentBlueprint_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentItem" ADD CONSTRAINT "AssessmentItem_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentItem" ADD CONSTRAINT "AssessmentItem_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "AssessmentBlueprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "AssessmentBlueprint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "AssessmentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CompetencyProfile" ADD CONSTRAINT "CompetencyProfile_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetencyProfile" ADD CONSTRAINT "CompetencyProfile_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetencyProfile" ADD CONSTRAINT "CompetencyProfile_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "SkillNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentRecommendation" ADD CONSTRAINT "AssessmentRecommendation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentRecommendation" ADD CONSTRAINT "AssessmentRecommendation_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
