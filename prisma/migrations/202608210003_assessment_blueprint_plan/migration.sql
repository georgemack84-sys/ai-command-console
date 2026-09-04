ALTER TABLE "AssessmentBlueprint"
  ADD COLUMN "assessedSkillIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "itemPlan" JSONB NOT NULL DEFAULT '[]';
