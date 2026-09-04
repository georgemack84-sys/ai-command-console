CREATE TABLE "noesis_learning_audit_events" (
  "event_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "previous_hash" TEXT,
  "event_hash" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "correlation_id" TEXT NOT NULL,
  "knowledge_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "payload" JSONB NOT NULL,
  "occurred_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "noesis_learning_audit_events_pkey" PRIMARY KEY ("event_id")
);
CREATE UNIQUE INDEX "noesis_learning_audit_events_workspace_id_sequence_key" ON "noesis_learning_audit_events"("workspace_id", "sequence");
CREATE INDEX "noesis_learning_audit_events_workspace_id_correlation_id_occurred_at_idx" ON "noesis_learning_audit_events"("workspace_id", "correlation_id", "occurred_at");
CREATE INDEX "noesis_learning_audit_events_workspace_id_event_type_occurred_at_idx" ON "noesis_learning_audit_events"("workspace_id", "event_type", "occurred_at");
CREATE INDEX "noesis_learning_audit_events_workspace_id_knowledge_ids_idx" ON "noesis_learning_audit_events" USING GIN ("knowledge_ids");
ALTER TABLE "noesis_learning_audit_events" ADD CONSTRAINT "noesis_learning_audit_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TRIGGER noesis_learning_audit_events_prevent_mutation BEFORE UPDATE OR DELETE ON "noesis_learning_audit_events" FOR EACH ROW EXECUTE FUNCTION prevent_noesis_phase9_ledger_mutation();
