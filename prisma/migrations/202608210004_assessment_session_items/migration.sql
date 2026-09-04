CREATE TABLE "AssessmentSessionItem" (
  "id" TEXT NOT NULL, "sessionId" TEXT NOT NULL, "itemId" TEXT NOT NULL,
  "position" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssessmentSessionItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssessmentSessionItem_sessionId_itemId_key" ON "AssessmentSessionItem"("sessionId", "itemId");
CREATE UNIQUE INDEX "AssessmentSessionItem_sessionId_position_key" ON "AssessmentSessionItem"("sessionId", "position");
CREATE INDEX "AssessmentSessionItem_itemId_idx" ON "AssessmentSessionItem"("itemId");
ALTER TABLE "AssessmentSessionItem" ADD CONSTRAINT "AssessmentSessionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentSessionItem" ADD CONSTRAINT "AssessmentSessionItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "AssessmentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
