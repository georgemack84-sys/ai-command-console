import { hashOperationalEvidence } from "./operationalEvidence";
import type { OperationalRuleEvaluation, OperationalState, ViolationEvent } from "./types";

export type AdvisoryStatus = "SAFE" | "CAUTION" | "ESCALATE" | "DISPUTED" | "FAILED";

export type AdvisoryClassification = "INFORMATIONAL" | "RISK" | "GOVERNANCE" | "OPERATIONAL";

export type OperationalRulesAdvisoryResult = Readonly<{
  advisoryStatus: AdvisoryStatus;
  classification: AdvisoryClassification;
  evidenceHash: string;
  ruleHash: string;
  ruleVersion: string;
  advisoryReasons: readonly string[];
  evidenceRefs: readonly string[];
  replayable: boolean;
  authority: "ADVISORY_ONLY";
  mayDeploy: false;
  mayRetry: false;
  mayRollback: false;
  mayCancel: false;
  mayResume: false;
  requiresExplicitEnforcementPhase: true;
}>;

export type OperationalRulesAdvisoryInput = Readonly<{
  evaluation: Partial<OperationalRuleEvaluation> & Record<string, unknown>;
  evidenceRefs?: readonly string[];
  expectedEvidenceHash?: string;
  ruleVersion?: string;
}>;

const DEFAULT_RULE_VERSION = "operational-rules-advisory/v1";

const GOVERNANCE_RULES = new Set([
  "UNKNOWN_UNSAFE",
  "DISPUTED_NON_DEPLOYABLE",
  "RELEASE_GATE_REQUIRED",
  "REPLAY_REMAINS_AUTHORITATIVE",
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeRefs(refs: readonly string[] | undefined) {
  return [...new Set((refs || []).filter(isNonEmptyString))].sort();
}

function normalizeViolations(value: unknown): readonly ViolationEvent[] {
  return Array.isArray(value) ? value.filter((entry): entry is ViolationEvent => Boolean(entry)) : [];
}

function hasAuthorityFlag(evaluation: Record<string, unknown>, key: string) {
  return evaluation[key] === true;
}

function hasUnknownState(authorityState: unknown) {
  return authorityState === "UNKNOWN" || authorityState === "DISPUTED";
}

function hasFailedState(authorityState: unknown) {
  return authorityState === "FAILED" || authorityState === "BLOCKED";
}

function hasConflictingOutput(evaluation: Record<string, unknown>, violations: readonly ViolationEvent[]) {
  return (
    (evaluation.ok === true && violations.length > 0) ||
    (evaluation.deployable === true && (evaluation.authorityState !== "PASSED" || violations.length > 0)) ||
    (evaluation.retryAllowed === true && violations.length > 0)
  );
}

function isAuthorityNormalizationReason(reason: string) {
  return reason.endsWith("_AUTHORITY_NORMALIZED_TO_ADVISORY");
}

function classify(violations: readonly ViolationEvent[], reasons: readonly string[]): AdvisoryClassification {
  if (reasons.includes("OPERATIONAL_RULE_EVIDENCE_MISSING")) return "OPERATIONAL";
  if (reasons.includes("UNKNOWN_STATE_FAIL_CLOSED") || violations.some((violation) => GOVERNANCE_RULES.has(violation.ruleId))) {
    return "GOVERNANCE";
  }
  if (violations.length > 0 || reasons.includes("OPERATIONAL_RULE_EVIDENCE_HASH_MISMATCH")) return "OPERATIONAL";
  if (reasons.length > 0) return "RISK";
  return "INFORMATIONAL";
}

function deriveStatus(
  authorityState: OperationalState | unknown,
  violations: readonly ViolationEvent[],
  reasons: readonly string[],
): AdvisoryStatus {
  if (reasons.includes("OPERATIONAL_RULE_EVIDENCE_MISSING")) return "FAILED";
  if (reasons.includes("OPERATIONAL_RULE_EVIDENCE_HASH_MISMATCH") || hasUnknownState(authorityState)) return "DISPUTED";
  if (reasons.includes("CONFLICTING_RULE_OUTPUT") || violations.length > 0 || hasFailedState(authorityState)) return "ESCALATE";
  if (reasons.some((reason) => !isAuthorityNormalizationReason(reason))) return "CAUTION";
  return "SAFE";
}

export function adaptOperationalRulesToAdvisory(input: OperationalRulesAdvisoryInput): OperationalRulesAdvisoryResult {
  const evaluation = input.evaluation;
  const violations = normalizeViolations(evaluation.violations);
  const reasons: string[] = [];
  const ruleVersion = input.ruleVersion || DEFAULT_RULE_VERSION;
  const sourceEvidenceHash = isNonEmptyString(evaluation.evidenceHash) ? evaluation.evidenceHash : "";

  if (!sourceEvidenceHash) {
    reasons.push("OPERATIONAL_RULE_EVIDENCE_MISSING");
  }

  if (input.expectedEvidenceHash && input.expectedEvidenceHash !== sourceEvidenceHash) {
    reasons.push("OPERATIONAL_RULE_EVIDENCE_HASH_MISMATCH");
  }

  if (hasUnknownState(evaluation.authorityState)) {
    reasons.push("UNKNOWN_STATE_FAIL_CLOSED");
  }

  if (hasConflictingOutput(evaluation, violations)) {
    reasons.push("CONFLICTING_RULE_OUTPUT");
  }

  if (hasAuthorityFlag(evaluation, "deployable")) {
    reasons.push("DEPLOY_AUTHORITY_NORMALIZED_TO_ADVISORY");
  }

  if (hasAuthorityFlag(evaluation, "retryAllowed")) {
    reasons.push("RETRY_AUTHORITY_NORMALIZED_TO_ADVISORY");
  }

  if (hasAuthorityFlag(evaluation, "cancelAllowed")) {
    reasons.push("CANCEL_AUTHORITY_NORMALIZED_TO_ADVISORY");
  }

  if (hasAuthorityFlag(evaluation, "rollbackAllowed")) {
    reasons.push("ROLLBACK_AUTHORITY_NORMALIZED_TO_ADVISORY");
  }

  if (hasAuthorityFlag(evaluation, "resumeAllowed")) {
    reasons.push("RESUME_AUTHORITY_NORMALIZED_TO_ADVISORY");
  }

  for (const violation of violations) {
    reasons.push(`RULE_VIOLATION:${violation.ruleId}`);
  }

  const advisoryReasons = [...new Set(reasons)].sort();
  const status = deriveStatus(evaluation.authorityState, violations, advisoryReasons);
  const evidenceRefs = normalizeRefs(input.evidenceRefs);
  const ruleHash = hashOperationalEvidence({
    authorityState: evaluation.authorityState ?? null,
    ruleIds: violations.map((violation) => violation.ruleId).sort(),
    ruleVersion,
  });

  return Object.freeze({
    advisoryStatus: status,
    classification: classify(violations, advisoryReasons),
    evidenceHash: sourceEvidenceHash,
    ruleHash,
    ruleVersion,
    advisoryReasons: Object.freeze(advisoryReasons),
    evidenceRefs: Object.freeze(evidenceRefs),
    replayable: status !== "FAILED" && status !== "DISPUTED",
    authority: "ADVISORY_ONLY",
    mayDeploy: false,
    mayRetry: false,
    mayRollback: false,
    mayCancel: false,
    mayResume: false,
    requiresExplicitEnforcementPhase: true,
  });
}
