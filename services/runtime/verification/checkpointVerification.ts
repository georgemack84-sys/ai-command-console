export function verifyCheckpointState({
  ledgerEvents = [],
  checkpointState = null,
}: {
  ledgerEvents?: Record<string, unknown>[];
  checkpointState?: string | null;
}) {
  const latestLedgerState = String(((ledgerEvents.at(-1)?.eventPayload || {}) as Record<string, unknown>).checkpointState || "");
  const normalizedCheckpointState = String(checkpointState || "");
  const matches = latestLedgerState === normalizedCheckpointState;
  return {
    valid: matches,
    evidence: matches ? ["checkpoint:matches_ledger"] : ["checkpoint:diverged"],
    disputes: matches ? [] : ["CHECKPOINT_DIVERGENCE"],
  };
}
