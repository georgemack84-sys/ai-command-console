// eslint-disable-next-line @typescript-eslint/no-require-imports
const { listAuditEvents } = require("../auditTrail.js");
import type { RecoveryVerificationResult } from "./recoveryVerificationTypes";

export function appendVerificationLedger(result: RecoveryVerificationResult) {
  return result.verificationId;
}

function mapVerificationEvent(event: Record<string, unknown>): RecoveryVerificationResult | null {
  if (String(event?.type || "") !== "recovery.verification.completed") {
    return null;
  }
  const payload = (event.payload || {}) as Record<string, unknown>;
  return {
    verificationId: String(payload.verificationId || event.id || ""),
    executionId: String(payload.executionId || ""),
    verified: Boolean(payload.verified),
    verificationState: String(payload.verificationState || "UNVERIFIABLE") as RecoveryVerificationResult["verificationState"],
    confidenceScore: Number(payload.confidenceScore || 0),
    runtimeIntegrity: Boolean(payload.runtimeIntegrity),
    replayIntegrity: Boolean(payload.replayIntegrity),
    governanceIntegrity: Boolean(payload.governanceIntegrity),
    continuityIntegrity: Boolean(payload.continuityIntegrity),
    disputes: Array.isArray(payload.disputes) ? payload.disputes.map((value) => String(value)) : [],
    evidence: Array.isArray(payload.evidence) ? payload.evidence.map((value) => String(value)) : [],
    verifiedAt: String(payload.verifiedAt || event.timestamp || ""),
    classificationId: payload.classificationId == null ? undefined : String(payload.classificationId),
    classificationCategory: payload.classificationCategory == null ? undefined : String(payload.classificationCategory),
    classificationSeverity: payload.classificationSeverity == null ? undefined : String(payload.classificationSeverity),
  };
}

export function getRecoveryVerificationById(verificationId: string) {
  const verifications: RecoveryVerificationResult[] = listAuditEvents(5000)
    .map((event: Record<string, unknown>) => mapVerificationEvent(event))
    .filter((result: RecoveryVerificationResult | null): result is RecoveryVerificationResult => result !== null);

  return verifications.find(
    (result: RecoveryVerificationResult) => result.verificationId === String(verificationId || "").trim(),
  ) || null;
}

export function listRecoveryVerificationsForExecution(executionId: string) {
  const verifications: RecoveryVerificationResult[] = listAuditEvents(5000)
    .map((event: Record<string, unknown>) => mapVerificationEvent(event))
    .filter((result: RecoveryVerificationResult | null): result is RecoveryVerificationResult => result !== null);

  return verifications
    .filter((result: RecoveryVerificationResult) => result.executionId === String(executionId || "").trim())
    .reverse();
}
