CREATE TABLE "knowledge_semantic_key_registry" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "allowed_scope_kinds" TEXT[] NOT NULL,
  "value_kind" TEXT NOT NULL,
  "allowed_values" TEXT[] NOT NULL,
  "owner_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "knowledge_semantic_key_registry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "knowledge_semantic_key_registry_workspace_id_key_key" ON "knowledge_semantic_key_registry"("workspace_id", "key");
CREATE INDEX "knowledge_semantic_key_registry_workspace_id_status_idx" ON "knowledge_semantic_key_registry"("workspace_id", "status");
ALTER TABLE "knowledge_semantic_key_registry" ADD CONSTRAINT "knowledge_semantic_key_registry_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
