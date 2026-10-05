CREATE TABLE "NuruVaultRecord" (
  "storageId" TEXT NOT NULL,
  "sequence" BIGSERIAL NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "schemaVersion" TEXT NOT NULL,
  "classification" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NuruVaultRecord_pkey" PRIMARY KEY ("storageId")
);
CREATE UNIQUE INDEX "NuruVaultRecord_sequence_key" ON "NuruVaultRecord"("sequence");
CREATE INDEX "NuruVaultRecord_workspaceId_recordId_sequence_idx" ON "NuruVaultRecord"("workspaceId", "recordId", "sequence");
CREATE INDEX "NuruVaultRecord_workspaceId_kind_sequence_idx" ON "NuruVaultRecord"("workspaceId", "kind", "sequence");
CREATE INDEX "NuruVaultRecord_workspaceId_correlationId_sequence_idx" ON "NuruVaultRecord"("workspaceId", "correlationId", "sequence");
CREATE OR REPLACE FUNCTION "nuru_vault_record_block_mutation"() RETURNS TRIGGER AS $$ BEGIN RAISE EXCEPTION 'Nuru Vault records are immutable'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "NuruVaultRecord_block_update" BEFORE UPDATE ON "NuruVaultRecord" FOR EACH ROW EXECUTE FUNCTION "nuru_vault_record_block_mutation"();
CREATE TRIGGER "NuruVaultRecord_block_delete" BEFORE DELETE ON "NuruVaultRecord" FOR EACH ROW EXECUTE FUNCTION "nuru_vault_record_block_mutation"();
