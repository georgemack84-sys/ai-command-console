CREATE TABLE "noesis_authority_bindings" (
  "binding_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "authority_id" TEXT NOT NULL,
  "authority_record" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "noesis_authority_bindings_pkey" PRIMARY KEY ("binding_id")
);
CREATE UNIQUE INDEX "noesis_authority_bindings_workspace_id_authority_id_key" ON "noesis_authority_bindings"("workspace_id", "authority_id");
CREATE INDEX "noesis_authority_bindings_workspace_id_created_at_idx" ON "noesis_authority_bindings"("workspace_id", "created_at");

CREATE TABLE "noesis_durable_registry_state" (
  "state_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "noesis_durable_registry_state_pkey" PRIMARY KEY ("state_id")
);
CREATE UNIQUE INDEX "noesis_durable_registry_state_workspace_id_key" ON "noesis_durable_registry_state"("workspace_id");

CREATE TABLE "noesis_durable_knowledge_records" (
  "knowledge_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "candidate_id" TEXT NOT NULL,
  "candidate_fingerprint" TEXT NOT NULL,
  "gate_decision_id" TEXT NOT NULL,
  "registry_version" INTEGER NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "noesis_durable_knowledge_records_pkey" PRIMARY KEY ("knowledge_id")
);
CREATE UNIQUE INDEX "noesis_durable_knowledge_records_workspace_id_candidate_id_key" ON "noesis_durable_knowledge_records"("workspace_id", "candidate_id");
CREATE UNIQUE INDEX "noesis_durable_knowledge_records_workspace_id_gate_decision_id_key" ON "noesis_durable_knowledge_records"("workspace_id", "gate_decision_id");
CREATE INDEX "noesis_durable_knowledge_records_workspace_id_registry_version_idx" ON "noesis_durable_knowledge_records"("workspace_id", "registry_version");

CREATE TABLE "noesis_gate_audit_events" (
  "event_id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "sequence" INTEGER NOT NULL, "previous_hash" TEXT, "event_hash" TEXT NOT NULL, "candidate_id" TEXT NOT NULL, "payload" JSONB NOT NULL, "occurred_at" TIMESTAMP(3) NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "noesis_gate_audit_events_pkey" PRIMARY KEY ("event_id")
);
CREATE UNIQUE INDEX "noesis_gate_audit_events_workspace_id_sequence_key" ON "noesis_gate_audit_events"("workspace_id", "sequence");
CREATE INDEX "noesis_gate_audit_events_workspace_id_candidate_id_occurred_at_idx" ON "noesis_gate_audit_events"("workspace_id", "candidate_id", "occurred_at");

CREATE TABLE "noesis_deferred_candidate_events" (
  "event_id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "sequence" INTEGER NOT NULL, "previous_hash" TEXT, "event_hash" TEXT NOT NULL, "deferred_candidate_id" TEXT NOT NULL, "candidate_id" TEXT NOT NULL, "payload" JSONB NOT NULL, "occurred_at" TIMESTAMP(3) NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "noesis_deferred_candidate_events_pkey" PRIMARY KEY ("event_id")
);
CREATE UNIQUE INDEX "noesis_deferred_candidate_events_workspace_id_sequence_key" ON "noesis_deferred_candidate_events"("workspace_id", "sequence");
CREATE INDEX "noesis_deferred_candidate_events_workspace_id_deferred_candidate_id_occurred_at_idx" ON "noesis_deferred_candidate_events"("workspace_id", "deferred_candidate_id", "occurred_at");

CREATE TABLE "noesis_deferred_resolution_events" (
  "event_id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "sequence" INTEGER NOT NULL, "previous_hash" TEXT, "event_hash" TEXT NOT NULL, "candidate_id" TEXT NOT NULL, "payload" JSONB NOT NULL, "occurred_at" TIMESTAMP(3) NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "noesis_deferred_resolution_events_pkey" PRIMARY KEY ("event_id")
);
CREATE UNIQUE INDEX "noesis_deferred_resolution_events_workspace_id_sequence_key" ON "noesis_deferred_resolution_events"("workspace_id", "sequence");
CREATE INDEX "noesis_deferred_resolution_events_workspace_id_candidate_id_occurred_at_idx" ON "noesis_deferred_resolution_events"("workspace_id", "candidate_id", "occurred_at");

ALTER TABLE "noesis_authority_bindings" ADD CONSTRAINT "noesis_authority_bindings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "noesis_durable_registry_state" ADD CONSTRAINT "noesis_durable_registry_state_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "noesis_durable_knowledge_records" ADD CONSTRAINT "noesis_durable_knowledge_records_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "noesis_gate_audit_events" ADD CONSTRAINT "noesis_gate_audit_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "noesis_deferred_candidate_events" ADD CONSTRAINT "noesis_deferred_candidate_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "noesis_deferred_resolution_events" ADD CONSTRAINT "noesis_deferred_resolution_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_noesis_phase9_ledger_mutation() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'Noesis Phase 9 ledger tables are append-only'; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER noesis_gate_audit_events_prevent_mutation BEFORE UPDATE OR DELETE ON "noesis_gate_audit_events" FOR EACH ROW EXECUTE FUNCTION prevent_noesis_phase9_ledger_mutation();
CREATE TRIGGER noesis_deferred_candidate_events_prevent_mutation BEFORE UPDATE OR DELETE ON "noesis_deferred_candidate_events" FOR EACH ROW EXECUTE FUNCTION prevent_noesis_phase9_ledger_mutation();
CREATE TRIGGER noesis_deferred_resolution_events_prevent_mutation BEFORE UPDATE OR DELETE ON "noesis_deferred_resolution_events" FOR EACH ROW EXECUTE FUNCTION prevent_noesis_phase9_ledger_mutation();
CREATE TRIGGER noesis_authority_bindings_prevent_mutation BEFORE UPDATE OR DELETE ON "noesis_authority_bindings" FOR EACH ROW EXECUTE FUNCTION prevent_noesis_phase9_ledger_mutation();
