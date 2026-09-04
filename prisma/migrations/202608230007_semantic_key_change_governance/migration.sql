ALTER TABLE "knowledge_semantic_key_registry" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "knowledge_semantic_key_versions" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "allowed_scope_kinds" TEXT[] NOT NULL,
  "value_kind" TEXT NOT NULL,
  "allowed_values" TEXT[] NOT NULL,
  "owner_id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "change_request_id" TEXT,
  "activated_at" TIMESTAMP(3) NOT NULL,
  "retired_at" TIMESTAMP(3),
  CONSTRAINT "knowledge_semantic_key_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "knowledge_semantic_key_versions_workspace_id_key_version_key" ON "knowledge_semantic_key_versions"("workspace_id", "key", "version");

INSERT INTO "knowledge_semantic_key_versions" ("id", "workspace_id", "key", "version", "description", "allowed_scope_kinds", "value_kind", "allowed_values", "owner_id", "status", "activated_at")
SELECT 'legacy-' || "id", "workspace_id", "key", "version", "description", "allowed_scope_kinds", "value_kind", "allowed_values", "owner_id", 'ACTIVE', "created_at"
FROM "knowledge_semantic_key_registry";

CREATE TABLE "knowledge_semantic_key_change_requests" (
  "request_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "base_version" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "allowed_scope_kinds" TEXT[] NOT NULL,
  "value_kind" TEXT NOT NULL,
  "allowed_values" TEXT[] NOT NULL,
  "requested_by_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "approved_by_id" TEXT,
  "rejection_reason" TEXT,
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  CONSTRAINT "knowledge_semantic_key_change_requests_pkey" PRIMARY KEY ("request_id")
);
CREATE INDEX "knowledge_semantic_key_change_requests_workspace_id_status_requested_at_idx" ON "knowledge_semantic_key_change_requests"("workspace_id", "status", "requested_at");
