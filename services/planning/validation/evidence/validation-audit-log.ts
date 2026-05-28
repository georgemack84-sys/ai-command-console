import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

import type { ValidationEvidence } from "../validation-result";

export function createValidationAuditLog(evidence: ValidationEvidence) {
  return appendImmutableLedgerEntry({
    scope: "planning-validation",
    payload: {
      validationRunId: evidence.validationRunId,
      schemaVersion: evidence.schemaVersion,
      graphHash: evidence.graphHash,
      validationHash: evidence.validationHash,
    },
  });
}

