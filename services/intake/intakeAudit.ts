import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashEvidence } from "@/services/audit/evidenceHashing";
import type { IntakeFailureType } from "@/types/intent/IntakeFailureType";
import type { IntakeSafetyInspection } from "@/types/intent/IntakeSafetyInspection";

export type IntakeAuditPayload = {
  requestId: string;
  source: string;
  state: "RECEIVED" | "NORMALIZED" | "VALIDATED" | "REJECTED" | "ACCEPTED" | "FORWARDED" | "FAILED";
  failureType?: IntakeFailureType;
  rejectionReason?: string;
  safety: IntakeSafetyInspection;
  normalizationSummary: {
    hasText: boolean;
    hasStructuredPayload: boolean;
  };
  metadata: {
    sessionId?: string;
    userId?: string;
    correlationId?: string;
    parentRequestId?: string;
  };
  receivedAt: number;
};

export function buildIntakeAuditRecord(input: IntakeAuditPayload) {
  const payload = {
    ...input,
    auditId: `intake-audit:${hashEvidence({
      requestId: input.requestId,
      state: input.state,
      receivedAt: input.receivedAt,
    }).slice(0, 16)}`,
    advisoryOnly: true as const,
  };

  return appendImmutableLedgerEntry({
    payload,
    scope: "intent-intake",
  });
}
