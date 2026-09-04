CREATE TABLE "LearningPlan" (
  "id" TEXT NOT NULL, "learnerId" TEXT NOT NULL, "version" TEXT NOT NULL,
  "status" TEXT NOT NULL, "goal" JSONB NOT NULL, "constraints" JSONB NOT NULL,
  "plan" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "supersededAt" TIMESTAMP(3), CONSTRAINT "LearningPlan_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LearningPlanLesson" (
  "id" TEXT NOT NULL, "planId" TEXT NOT NULL, "lessonKey" TEXT NOT NULL,
  "position" INTEGER NOT NULL, "skillId" TEXT NOT NULL, "lesson" JSONB NOT NULL,
  CONSTRAINT "LearningPlanLesson_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LearningPlanEvent" (
  "id" TEXT NOT NULL, "planId" TEXT NOT NULL, "lessonId" TEXT, "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "metadata" JSONB,
  CONSTRAINT "LearningPlanEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LearningPlan_learnerId_createdAt_idx" ON "LearningPlan"("learnerId", "createdAt");
CREATE INDEX "LearningPlan_learnerId_supersededAt_idx" ON "LearningPlan"("learnerId", "supersededAt");
CREATE UNIQUE INDEX "LearningPlanLesson_planId_lessonKey_key" ON "LearningPlanLesson"("planId", "lessonKey");
CREATE UNIQUE INDEX "LearningPlanLesson_planId_position_key" ON "LearningPlanLesson"("planId", "position");
CREATE INDEX "LearningPlanEvent_planId_createdAt_idx" ON "LearningPlanEvent"("planId", "createdAt");
CREATE INDEX "LearningPlanEvent_lessonId_idx" ON "LearningPlanEvent"("lessonId");
ALTER TABLE "LearningPlan" ADD CONSTRAINT "LearningPlan_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningPlanLesson" ADD CONSTRAINT "LearningPlanLesson_planId_fkey" FOREIGN KEY ("planId") REFERENCES "LearningPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningPlanEvent" ADD CONSTRAINT "LearningPlanEvent_planId_fkey" FOREIGN KEY ("planId") REFERENCES "LearningPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningPlanEvent" ADD CONSTRAINT "LearningPlanEvent_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "LearningPlanLesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
