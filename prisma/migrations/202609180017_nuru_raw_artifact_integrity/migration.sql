-- NSI-33: raw artifacts are content-addressed, byte-verified, and immutable.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "NuruRawArtifact"
  ADD CONSTRAINT "NuruRawArtifact_byteLength_matches_body"
  CHECK (octet_length("body") = "byteLength"),
  ADD CONSTRAINT "NuruRawArtifact_contentHash_format"
  CHECK ("contentHash" ~ '^sha256:[0-9a-f]{64}$');

CREATE UNIQUE INDEX "NuruRawArtifact_workspaceId_sourceRegistryId_contentHash_key"
  ON "NuruRawArtifact"("workspaceId", "sourceRegistryId", "contentHash");

CREATE OR REPLACE FUNCTION "nuru_raw_artifact_verify_insert"()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."contentHash" <> 'sha256:' || encode(digest(NEW."body", 'sha256'), 'hex') THEN
    RAISE EXCEPTION 'NuruRawArtifact content hash does not match its body';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "nuru_raw_artifact_block_mutation"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'NuruRawArtifact records are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "NuruRawArtifact_verify_insert"
  BEFORE INSERT ON "NuruRawArtifact"
  FOR EACH ROW EXECUTE FUNCTION "nuru_raw_artifact_verify_insert"();

CREATE TRIGGER "NuruRawArtifact_block_update"
  BEFORE UPDATE ON "NuruRawArtifact"
  FOR EACH ROW EXECUTE FUNCTION "nuru_raw_artifact_block_mutation"();

CREATE TRIGGER "NuruRawArtifact_block_delete"
  BEFORE DELETE ON "NuruRawArtifact"
  FOR EACH ROW EXECUTE FUNCTION "nuru_raw_artifact_block_mutation"();
