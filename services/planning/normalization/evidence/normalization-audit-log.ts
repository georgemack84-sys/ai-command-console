import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

import type { NormalizationEvidence } from "../normalization-types";

export function appendNormalizationAuditLog(evidence: Omit<NormalizationEvidence, "immutableAuditLedgerId">) {
  return appendImmutableLedgerEntry({
    scope: "planning-normalization",
    payload: {
      validationRunId: evidence.validationRunId,
      graphHash: evidence.graphHash,
      validationHash: evidence.validationHash,
      normalizationHash: evidence.normalizationHash,
      replayHash: evidence.replayHash,
    },
  });
}

