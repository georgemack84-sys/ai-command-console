export function verifyRuntimeLedger(ledgerEvents: Record<string, unknown>[] = []) {
  if (ledgerEvents.length === 0) {
    return {
      valid: false,
      evidence: ["ledger:missing"],
      disputes: ["LEDGER_MISSING"],
    };
  }

  const ordered = ledgerEvents.every((event, index, entries) => {
    if (index === 0) return true;
    return Number(event.sequence ?? index) >= Number(entries[index - 1].sequence ?? index - 1);
  });

  return {
    valid: ordered,
    evidence: ["ledger:present"],
    disputes: ordered ? [] : ["LEDGER_OUT_OF_ORDER"],
  };
}
