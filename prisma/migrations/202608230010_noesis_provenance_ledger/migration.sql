CREATE TABLE "noesis_provenance_records" (
  "record_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "record_type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "noesis_provenance_records_pkey" PRIMARY KEY ("record_id")
);

CREATE INDEX "noesis_provenance_records_workspace_id_record_type_created_at_idx"
  ON "noesis_provenance_records"("workspace_id", "record_type", "created_at");

CREATE TABLE "noesis_provenance_relationships" (
  "relationship_id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "from_record_id" TEXT NOT NULL,
  "to_record_id" TEXT NOT NULL,
  "relationship_type" TEXT NOT NULL,
  "actor" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "noesis_provenance_relationships_pkey" PRIMARY KEY ("relationship_id")
);

CREATE UNIQUE INDEX "noesis_provenance_relationships_workspace_id_from_record_id_to_record_id_relationship_type_key"
  ON "noesis_provenance_relationships"("workspace_id", "from_record_id", "to_record_id", "relationship_type");
CREATE INDEX "noesis_provenance_relationships_workspace_id_from_record_id_created_at_idx"
  ON "noesis_provenance_relationships"("workspace_id", "from_record_id", "created_at");
CREATE INDEX "noesis_provenance_relationships_workspace_id_to_record_id_created_at_idx"
  ON "noesis_provenance_relationships"("workspace_id", "to_record_id", "created_at");

CREATE OR REPLACE FUNCTION prevent_noesis_provenance_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Noesis provenance ledger is append-only'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER noesis_provenance_records_prevent_mutation
  BEFORE UPDATE OR DELETE ON "noesis_provenance_records"
  FOR EACH ROW EXECUTE FUNCTION prevent_noesis_provenance_mutation();

CREATE TRIGGER noesis_provenance_relationships_prevent_mutation
  BEFORE UPDATE OR DELETE ON "noesis_provenance_relationships"
  FOR EACH ROW EXECUTE FUNCTION prevent_noesis_provenance_mutation();
