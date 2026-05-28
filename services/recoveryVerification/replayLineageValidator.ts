export function validateReplayLineage({
  ledgerEvents = [],
  bundle,
}: {
  ledgerEvents?: any[];
  bundle: any;
}) {
  const evidence: string[] = [];
  if (!Array.isArray(ledgerEvents) || ledgerEvents.length === 0) {
    evidence.push("ledger:missing");
  }
  if (Number(bundle?.readModel?.ledger?.totalEvents || 0) > 0 && ledgerEvents.length === 0) {
    evidence.push("ledger:orphaned");
  }
  return {
    valid: evidence.length === 0,
    evidence,
  };
}
