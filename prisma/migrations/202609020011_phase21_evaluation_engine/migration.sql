CREATE TABLE "noesis_evaluation_artifacts" (
  "artifact_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "artifact_type" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "noesis_evaluation_artifacts_pkey" PRIMARY KEY ("artifact_id"),
  CONSTRAINT "noesis_evaluation_artifacts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE
);
CREATE INDEX "noesis_evaluation_artifacts_workspace_id_artifact_type_created_at_idx" ON "noesis_evaluation_artifacts"("workspace_id", "artifact_type", "created_at");
CREATE INDEX "noesis_evaluation_artifacts_workspace_id_subject_id_created_at_idx" ON "noesis_evaluation_artifacts"("workspace_id", "subject_id", "created_at");
CREATE TRIGGER noesis_evaluation_artifacts_prevent_mutation BEFORE UPDATE OR DELETE ON "noesis_evaluation_artifacts" FOR EACH ROW EXECUTE FUNCTION prevent_noesis_phase9_ledger_mutation();
