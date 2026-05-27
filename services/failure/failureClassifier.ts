import { FAILURE_SEVERITY, deriveFailureSeverity, type FailureSeverity } from "./failureSeverity";
import { collectFailureEvidence, type FailureEvidenceSources, type FailureSignal } from "./failureEvidence";
import { FAILURE_CATEGORIES, getFailureCategoryDefinition, resolveFailureCategory, type FailureCategory } from "./failureCategories";
import type { TenantContext } from "../tenancy/tenantTypes";

export type FailureClassification = {
  category: string;
  severity: string;
  recoverable: boolean;
  requiresApproval: boolean;
  requiresEscalation: boolean;
  confidence: number;
  evidence: string[];
};

export type FailureClassificationResult =
  | { ok: true; data: FailureClassification & { classificationId: string; categoryCode: string } }
  | { ok: false; error: { code: string; message: string; details?: Record<string, unknown> }; classification?: FailureClassification & { classificationId: string; categoryCode: string } };

function clampConfidence(value: number) {
  return Math.max(0, Math.min(1, value));
}

function createClassificationId(category: FailureCategory, evidence: string[]) {
  return `failure_${category.replace(/\s+/g, "_")}_${evidence.join("|")}`;
}

function inferCategoryFromEvidence(evidence: string[]): FailureCategory | null {
  const normalized = evidence.map((entry) => entry.toLowerCase());
  if (normalized.includes("replay:divergent")) return "replay divergence";
  if (normalized.includes("timeline:disputed")) return "evidence inconsistency";
  if (normalized.includes("verification:failed")) return "verification mismatch";
  if (normalized.includes("policy:denied") || normalized.includes("governance:decision=deny")) return "governance denial";
  if (normalized.includes("approval:expired")) return "approval expiration";
  if (normalized.includes("database:unavailable")) return "database unavailable";
  if (normalized.includes("heartbeat:missing")) return "heartbeat loss";
  if (normalized.includes("lease:expired") || normalized.includes("lock:stale")) return "lease expiration";
  if (normalized.includes("timeout:step_duration_exceeded")) return "timeout";
  if (normalized.includes("execution:stale")) return "stale execution";
  return null;
}

function deriveConfidence(category: FailureCategory, evidence: string[], contradictory: boolean) {
  const definition = getFailureCategoryDefinition(category);
  const matchedExpectedEvidence = definition.expectedEvidence.filter((entry) => evidence.includes(entry)).length;
  const evidenceScore = Math.min(0.3, evidence.length * 0.08);
  const expectedScore = Math.min(0.25, matchedExpectedEvidence * 0.12);
  const contradictionPenalty = contradictory ? 0.45 : 0;
  return clampConfidence(0.45 + evidenceScore + expectedScore - contradictionPenalty);
}

export async function classifyFailure({
  signal,
  executionId,
  tenantContext,
  sources = {},
  nowMs,
}: {
  signal?: FailureSignal;
  executionId?: string;
  tenantContext?: TenantContext;
  sources?: FailureEvidenceSources;
  nowMs?: number;
}): Promise<FailureClassificationResult> {
  const evidenceResult = await collectFailureEvidence({
    executionId,
    tenantContext,
    signal,
    sources,
    nowMs,
  });
  if (!evidenceResult.ok) {
    return evidenceResult;
  }

  const normalizedCategory = resolveFailureCategory(String(signal?.type || "")) || inferCategoryFromEvidence(evidenceResult.data.evidence);
  if (!normalizedCategory || !(normalizedCategory in FAILURE_CATEGORIES)) {
    return {
      ok: false,
      error: {
        code: "FAILURE_CLASSIFICATION_UNSUPPORTED_CATEGORY",
        message: "The failure could not be classified deterministically.",
        details: {
          signal: signal?.type || null,
          evidence: evidenceResult.data.evidence,
        },
      },
    };
  }

  const definition = getFailureCategoryDefinition(normalizedCategory);
  const severity = deriveFailureSeverity({
    defaultSeverity: definition.defaultSeverity as FailureSeverity,
    evidence: evidenceResult.data.evidence,
    contradictory: evidenceResult.data.contradictory,
    severityHint: resolveFailureCategory(String(signal?.type || "")) ? definition.defaultSeverity : null,
  });
  const classification = {
    classificationId: createClassificationId(normalizedCategory, evidenceResult.data.evidence),
    category: normalizedCategory,
    categoryCode: definition.normalizedCode,
    severity,
    recoverable: definition.recoverable && severity !== FAILURE_SEVERITY.CATASTROPHIC,
    requiresApproval: definition.requiresApproval || severity === FAILURE_SEVERITY.CRITICAL || severity === FAILURE_SEVERITY.CATASTROPHIC,
    requiresEscalation: definition.requiresEscalation || severity === FAILURE_SEVERITY.CRITICAL || severity === FAILURE_SEVERITY.CATASTROPHIC,
    confidence: deriveConfidence(normalizedCategory, evidenceResult.data.evidence, evidenceResult.data.contradictory),
    evidence: evidenceResult.data.evidence,
  };

  if (evidenceResult.data.contradictory) {
    return {
      ok: false,
      error: {
        code: "FAILURE_CLASSIFICATION_DISPUTED",
        message: "Failure evidence is contradictory and classification is disputed.",
        details: {
          evidence: evidenceResult.data.evidence,
        },
      },
      classification,
    };
  }

  if (classification.confidence < 0.4) {
    return {
      ok: false,
      error: {
        code: "FAILURE_CLASSIFICATION_LOW_CONFIDENCE",
        message: "Failure classification confidence is too low for governed recovery.",
        details: {
          confidence: classification.confidence,
          evidence: classification.evidence,
        },
      },
      classification,
    };
  }

  return {
    ok: true,
    data: classification,
  };
}
