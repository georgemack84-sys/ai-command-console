CREATE OR REPLACE FUNCTION prevent_authority_ledger_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'authority_ledger_events is append-only'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER authority_ledger_events_prevent_update
  BEFORE UPDATE ON "authority_ledger_events"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_authority_ledger_mutation();

CREATE TRIGGER authority_ledger_events_prevent_delete
  BEFORE DELETE ON "authority_ledger_events"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_authority_ledger_mutation();
