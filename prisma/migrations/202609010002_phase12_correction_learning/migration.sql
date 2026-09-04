CREATE TABLE "noesis_corrections" ("correction_id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "status" TEXT NOT NULL, "payload" JSONB NOT NULL, "created_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "noesis_corrections_pkey" PRIMARY KEY ("correction_id"));
CREATE TABLE "noesis_correction_evidence" ("record_id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "correction_id" TEXT NOT NULL, "record_type" TEXT NOT NULL, "payload" JSONB NOT NULL, "created_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "noesis_correction_evidence_pkey" PRIMARY KEY ("record_id"));
CREATE INDEX "noesis_corrections_workspace_id_status_created_at_idx" ON "noesis_corrections"("workspace_id", "status", "created_at");
CREATE INDEX "noesis_correction_evidence_workspace_id_correction_id_record_type_created_at_idx" ON "noesis_correction_evidence"("workspace_id", "correction_id", "record_type", "created_at");
ALTER TABLE "noesis_corrections" ADD CONSTRAINT "noesis_corrections_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE;
ALTER TABLE "noesis_correction_evidence" ADD CONSTRAINT "noesis_correction_evidence_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE;
CREATE TRIGGER noesis_corrections_prevent_mutation BEFORE UPDATE OR DELETE ON "noesis_corrections" FOR EACH ROW EXECUTE FUNCTION prevent_noesis_phase9_ledger_mutation();
CREATE TRIGGER noesis_correction_evidence_prevent_mutation BEFORE UPDATE OR DELETE ON "noesis_correction_evidence" FOR EACH ROW EXECUTE FUNCTION prevent_noesis_phase9_ledger_mutation();
