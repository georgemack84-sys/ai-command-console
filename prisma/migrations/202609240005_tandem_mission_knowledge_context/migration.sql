-- TD-N08: immutable Nuru snapshots used as Tandem mission context.
CREATE TABLE "TandemMissionKnowledgePackage" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "missionId" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "attachedBy" TEXT NOT NULL,
  "attachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "knowledgePackage" JSONB NOT NULL,
  CONSTRAINT "TandemMissionKnowledgePackage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TandemMissionKnowledgePackage_workspaceId_missionId_packageId_key" ON "TandemMissionKnowledgePackage"("workspaceId", "missionId", "packageId");
CREATE INDEX "TandemMissionKnowledgePackage_workspaceId_missionId_attachedAt_idx" ON "TandemMissionKnowledgePackage"("workspaceId", "missionId", "attachedAt");

CREATE OR REPLACE FUNCTION "tandem_mission_knowledge_package_block_mutation"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Tandem mission knowledge packages are immutable snapshots';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "TandemMissionKnowledgePackage_block_update" BEFORE UPDATE ON "TandemMissionKnowledgePackage" FOR EACH ROW EXECUTE FUNCTION "tandem_mission_knowledge_package_block_mutation"();
CREATE TRIGGER "TandemMissionKnowledgePackage_block_delete" BEFORE DELETE ON "TandemMissionKnowledgePackage" FOR EACH ROW EXECUTE FUNCTION "tandem_mission_knowledge_package_block_mutation"();
