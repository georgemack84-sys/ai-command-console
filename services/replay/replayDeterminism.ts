type ReplayDeterminismResult = {
  deterministic: boolean;
  missingEvidence: string[];
  warnings: string[];
};

export function assessReplayDeterminism({
  ledgerEvents = [],
  continuitySnapshots = [],
  auditEvents = [],
}: {
  ledgerEvents?: Record<string, unknown>[];
  continuitySnapshots?: Record<string, unknown>[];
  auditEvents?: Record<string, unknown>[];
}): ReplayDeterminismResult {
  const missingEvidence: string[] = [];
  const warnings: string[] = [];

  if (ledgerEvents.length === 0) {
    missingEvidence.push("ledger:missing");
  }
  if (continuitySnapshots.length === 0) {
    missingEvidence.push("continuity:missing");
  }
  if (auditEvents.length === 0) {
    missingEvidence.push("audit:missing");
  }

  const sequenceValues = ledgerEvents.map((event, index) => Number(event.sequence ?? event.seq ?? event.ledgerIndex ?? index));
  const uniqueValues = new Set(sequenceValues);
  if (uniqueValues.size !== sequenceValues.length) {
    warnings.push("sequence:duplicate");
  }

  return {
    deterministic: missingEvidence.length === 0 && !warnings.includes("sequence:duplicate"),
    missingEvidence,
    warnings,
  };
}
