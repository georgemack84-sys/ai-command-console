CREATE TABLE "noesis_knowledge_gap_artifacts" (
  "artifact_id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "artifact_type" TEXT NOT NULL, "subject_id" TEXT NOT NULL, "payload" JSONB NOT NULL, "created_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "noesis_knowledge_gap_artifacts_pkey" PRIMARY KEY ("artifact_id"),
  CONSTRAINT "noesis_knowledge_gap_artifacts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "noesis_knowledge_gap_artifacts_workspace_id_artifact_type_created_at_idx" ON "noesis_knowledge_gap_artifacts"("workspace_id", "artifact_type", "created_at");
CREATE INDEX "noesis_knowledge_gap_artifacts_workspace_id_subject_id_created_at_idx" ON "noesis_knowledge_gap_artifacts"("workspace_id", "subject_id", "created_at");
CREATE FUNCTION prevent_noesis_knowledge_gap_artifact_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'noesis_knowledge_gap_artifacts are append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER noesis_knowledge_gap_artifacts_append_only BEFORE UPDATE OR DELETE ON "noesis_knowledge_gap_artifacts" FOR EACH ROW EXECUTE FUNCTION prevent_noesis_knowledge_gap_artifact_mutation();
