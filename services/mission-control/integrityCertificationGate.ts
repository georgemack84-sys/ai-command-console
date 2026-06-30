import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  TruthIntegrityCertificationCategory,
  TruthIntegrityCertificationGateInput,
  TruthIntegrityCertificationGateResult,
  TruthIntegrityCertificationLedgerRecord,
  TruthIntegrityCertificationOperatorVisibilityReport,
  TruthIntegrityFinalCertificationState,
  TruthIntegrityVerificationResult,
  TruthVerificationCheckResult,
} from "./types";

const CHECK_CATEGORY: Readonly<Record<keyof TruthIntegrityVerificationResult["checks"], TruthIntegrityCertificationCategory>> = {
  schema_check: "Contract Integrity",
  identity_check: "Identity Integrity",
  hash_check: "Hash Integrity",
  chain_check: "Chain Integrity",
  tamper_check: "Tamper Integrity",
  lineage_check: "Lineage Integrity",
  evidence_check: "Evidence Integrity",
  replay_check: "Replay Integrity",
  governance_check: "Governance Integrity",
  tenant_boundary_check: "Tenant Integrity",
  archive_check: "Archive Integrity",
  index_check: "Index Integrity",
};

const ALL_CATEGORIES: readonly TruthIntegrityCertificationCategory[] = Object.freeze([
  "Contract Integrity",
  "Identity Integrity",
  "Hash Integrity",
  "Chain Integrity",
  "Tamper Integrity",
  "Lineage Integrity",
  "Evidence Integrity",
  "Replay Integrity",
  "Governance Integrity",
  "Tenant Integrity",
  "Archive Integrity",
  "Index Integrity",
  "Certification Result Integrity",
]);

const HARD_BLOCKER_CATEGORIES: readonly TruthIntegrityCertificationCategory[] = Object.freeze([
  "Contract Integrity",
  "Identity Integrity",
  "Hash Integrity",
  "Chain Integrity",
  "Tamper Integrity",
  "Lineage Integrity",
  "Evidence Integrity",
  "Replay Integrity",
  "Governance Integrity",
  "Tenant Integrity",
  "Archive Integrity",
  "Certification Result Integrity",
]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function validateInput(input: TruthIntegrityCertificationGateInput): readonly string[] {
  const reasons: string[] = [];
  if (!input.certification_request_id) reasons.push("Certification request ID is required.");
  if (!input.tenant_id) reasons.push("Tenant ID is required.");
  if (!input.certification_scope) reasons.push("Certification scope is required.");
  if (!input.requested_by) reasons.push("Requesting actor is required.");
  if (!input.requested_at) reasons.push("Request timestamp is required.");
  if (input.fail_closed && input.verification_result_ids.length === 0) reasons.push("Fail-closed certification requires at least one verification result.");
  const hasTarget = (input.target_record_ids?.length ?? 0) > 0
    || (input.target_chain_ids?.length ?? 0) > 0
    || (input.replay_bundle_ids?.length ?? 0) > 0
    || (input.evidence_bundle_ids?.length ?? 0) > 0
    || (input.lineage_graph_ids?.length ?? 0) > 0
    || (input.governance_scope_ids?.length ?? 0) > 0
    || (input.archive_package_ids?.length ?? 0) > 0;
  if (!hasTarget) reasons.push("Certification requires at least one target scope identifier.");
  return Object.freeze(reasons);
}

function checkFailureReason(category: TruthIntegrityCertificationCategory, check: TruthVerificationCheckResult): string {
  const reason = check.rationale[0] ?? `${category} failed.`;
  return `${category}: ${reason}`;
}

function checkWarningReason(category: TruthIntegrityCertificationCategory, check: TruthVerificationCheckResult): string {
  const reason = check.rationale[0] ?? `${category} is degraded.`;
  return `${category}: ${reason}`;
}

function targetIds(input: TruthIntegrityCertificationGateInput, results: readonly TruthIntegrityVerificationResult[]): readonly string[] {
  return unique([
    ...(input.target_record_ids ?? []),
    ...(input.target_chain_ids ?? []),
    ...(input.replay_bundle_ids ?? []),
    ...(input.evidence_bundle_ids ?? []),
    ...(input.lineage_graph_ids ?? []),
    ...(input.governance_scope_ids ?? []),
    ...(input.archive_package_ids ?? []),
    ...results.flatMap((result) => result.verified_record_ids),
    ...results.flatMap((result) => result.failed_record_ids),
    ...results.flatMap((result) => result.unverifiable_record_ids),
    ...results.flatMap((result) => result.affected_chain_ids ?? []),
    ...results.flatMap((result) => result.affected_replay_refs ?? []),
    ...results.flatMap((result) => result.affected_evidence_refs ?? []),
    ...results.flatMap((result) => result.affected_lineage_refs ?? []),
    ...results.flatMap((result) => result.affected_governance_refs ?? []),
  ]);
}

function statusBucket(check: TruthVerificationCheckResult): "PASS" | "WARN" | "FAIL" {
  if (check.status === "PASS") return "PASS";
  if (check.status === "WARN" || check.status === "SKIPPED") return "WARN";
  return "FAIL";
}

function mapVerificationState(state: TruthIntegrityVerificationResult["verification_state"]): TruthIntegrityFinalCertificationState {
  if (state === "VERIFIED") return "VALID";
  if (state === "PARTIALLY_VERIFIED" || state === "DEGRADED") return "DEGRADED";
  return "CORRUPTED";
}

function findingRefs(input: TruthIntegrityCertificationGateInput, results: readonly TruthIntegrityVerificationResult[]): readonly string[] {
  return unique([
    ...(input.tamper_finding_ids ?? []),
    ...(input.integrity_finding_ids ?? []),
    ...(input.replay_finding_ids ?? []),
    ...(input.governance_finding_ids ?? []),
    ...(input.lineage_finding_ids ?? []),
    ...results.flatMap((result) => result.tamper_findings ?? []),
    ...results.flatMap((result) => result.integrity_findings ?? []),
    ...results.flatMap((result) => result.replay_findings ?? []),
    ...results.flatMap((result) => result.governance_findings ?? []),
    ...results.flatMap((result) => result.lineage_findings ?? []),
  ]);
}

export function certifyTruthIntegrity(
  input: TruthIntegrityCertificationGateInput,
  verificationResults: readonly TruthIntegrityVerificationResult[],
  previousCertificationHash?: string,
): TruthIntegrityCertificationGateResult {
  const invalidReasons = validateInput(input);
  const resultById = new Map(verificationResults.map((result) => [result.verification_result_id, result]));
  const missingResultIds = input.verification_result_ids.filter((id) => !resultById.has(id));
  const selectedResults = input.verification_result_ids.length > 0
    ? input.verification_result_ids.flatMap((id) => {
        const result = resultById.get(id);
        return result ? [result] : [];
      })
    : [...verificationResults];
  const tenantDrift = selectedResults.filter((result) => result.tenant_id !== input.tenant_id);

  const categoryBuckets = new Map<TruthIntegrityCertificationCategory, "PASS" | "WARN" | "FAIL">(
    ALL_CATEGORIES.map((category) => [category, "PASS"]),
  );
  const warnings: string[] = [];
  const blockingReasons: string[] = [];

  for (const result of selectedResults) {
    for (const [checkName, checkResult] of Object.entries(result.checks) as [keyof TruthIntegrityVerificationResult["checks"], TruthVerificationCheckResult][]) {
      const category = CHECK_CATEGORY[checkName];
      const bucket = statusBucket(checkResult);
      const existing = categoryBuckets.get(category) ?? "PASS";
      if (bucket === "FAIL" || existing === "FAIL") categoryBuckets.set(category, "FAIL");
      else if (bucket === "WARN" || existing === "WARN") categoryBuckets.set(category, "WARN");

      if (bucket === "FAIL") blockingReasons.push(checkFailureReason(category, checkResult));
      if (bucket === "WARN") warnings.push(checkWarningReason(category, checkResult));
    }
  }

  if (invalidReasons.length > 0) {
    categoryBuckets.set("Contract Integrity", "FAIL");
    blockingReasons.push(...invalidReasons);
  }
  if (missingResultIds.length > 0) {
    categoryBuckets.set("Certification Result Integrity", "FAIL");
    blockingReasons.push(`Missing required verification result(s): ${missingResultIds.join(", ")}.`);
  }
  if (tenantDrift.length > 0) {
    categoryBuckets.set("Tenant Integrity", "FAIL");
    blockingReasons.push("Verification result tenant scope does not match the certification request tenant.");
  }
  if (input.tamper_finding_ids && input.tamper_finding_ids.length > 0) {
    categoryBuckets.set("Tamper Integrity", "FAIL");
    blockingReasons.push("Unresolved tamper findings are attached to the certification request.");
  }

  const passedCategories = ALL_CATEGORIES.filter((category) => categoryBuckets.get(category) === "PASS");
  const degradedCategories = ALL_CATEGORIES.filter((category) => categoryBuckets.get(category) === "WARN");
  const failedCategories = ALL_CATEGORIES.filter((category) => categoryBuckets.get(category) === "FAIL");
  const mappedStates = selectedResults.map((result) => mapVerificationState(result.verification_state));
  const hasVerificationCorruption = mappedStates.includes("CORRUPTED");
  const hasVerificationDegradation = mappedStates.includes("DEGRADED");
  const hardBlocker = failedCategories.some((category) => HARD_BLOCKER_CATEGORIES.includes(category));

  let state: TruthIntegrityFinalCertificationState = "VALID";
  if (invalidReasons.length > 0 || missingResultIds.length > 0 || tenantDrift.length > 0 || input.tamper_finding_ids?.length || hasVerificationCorruption || hardBlocker) {
    state = "CORRUPTED";
  } else if (hasVerificationDegradation || degradedCategories.length > 0) {
    state = "DEGRADED";
  }

  if (state === "DEGRADED" && input.require_full_verification) {
    state = "CORRUPTED";
    blockingReasons.push("Full verification is required, but one or more categories are degraded or skipped.");
  }
  if (state === "DEGRADED" && !input.allow_degraded_state) {
    state = "CORRUPTED";
    blockingReasons.push("Degraded certification is not allowed for this request.");
  }

  const allTargets = targetIds(input, selectedResults);
  const corruptedTargets = unique([
    ...selectedResults.flatMap((result) => result.failed_record_ids),
    ...selectedResults.flatMap((result) => result.unverifiable_record_ids),
    ...(state === "CORRUPTED" && selectedResults.length === 0 ? allTargets : []),
  ]);
  const validTargets = state === "VALID" ? allTargets : [];
  const degradedTargets = state === "DEGRADED" ? allTargets : [];
  const governanceReviewRequired = state === "CORRUPTED"
    || failedCategories.includes("Governance Integrity")
    || failedCategories.includes("Tenant Integrity")
    || degradedCategories.includes("Governance Integrity")
    || degradedCategories.includes("Tenant Integrity");
  const operatorReviewRequired = state !== "VALID" || selectedResults.some((result) => result.operator_review_required);
  const escalationRequired = state === "CORRUPTED"
    || failedCategories.includes("Governance Integrity")
    || failedCategories.includes("Tenant Integrity")
    || failedCategories.includes("Tamper Integrity")
    || selectedResults.some((result) => result.escalation_required);
  const rationale = unique([
    ...selectedResults.flatMap((result) => result.rationale),
    state === "VALID" ? "All required integrity categories passed certification." : undefined,
    state === "DEGRADED" ? "Certification is conditional because one or more non-critical categories are degraded or skipped." : undefined,
    state === "CORRUPTED" ? "Certification is blocked because integrity could not be proven for the requested scope." : undefined,
  ].filter((item): item is string => !!item));

  const resultWithoutHash = {
    certification_result_id: `icg_result_${input.certification_request_id}`,
    certification_request_id: input.certification_request_id,
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    certification_scope: input.certification_scope,
    state,
    valid_targets: Object.freeze(validTargets),
    degraded_targets: Object.freeze(degradedTargets),
    corrupted_targets: Object.freeze(corruptedTargets),
    passed_categories: Object.freeze(passedCategories),
    degraded_categories: Object.freeze(degradedCategories),
    failed_categories: Object.freeze(failedCategories),
    verification_result_ids: Object.freeze(input.verification_result_ids),
    tamper_finding_ids: input.tamper_finding_ids,
    integrity_finding_ids: input.integrity_finding_ids,
    replay_finding_ids: input.replay_finding_ids,
    governance_finding_ids: input.governance_finding_ids,
    lineage_finding_ids: input.lineage_finding_ids,
    certification_allowed: state === "VALID",
    conditional_certification_allowed: state === "DEGRADED" && input.allow_degraded_state,
    replay_allowed: state !== "CORRUPTED",
    governance_review_required: governanceReviewRequired,
    operator_review_required: operatorReviewRequired,
    escalation_required: escalationRequired,
    blocking_reasons: Object.freeze(unique(blockingReasons)),
    warnings: Object.freeze(unique(warnings)),
    rationale,
    certified_at: input.requested_at,
    appendOnly: true as const,
    sourceMutationAllowed: false as const,
  };

  return Object.freeze({
    ...resultWithoutHash,
    result_hash: hashValue("mission-control-integrity-certification-gate-result-hash", {
      ...resultWithoutHash,
      previous_certification_hash: previousCertificationHash,
    }),
  });
}

export function toTruthIntegrityCertificationLedgerRecord(
  result: TruthIntegrityCertificationGateResult,
  input: TruthIntegrityCertificationGateInput,
  previousCertificationHash?: string,
): TruthIntegrityCertificationLedgerRecord {
  return Object.freeze({
    certification_ledger_record_id: `certification_ledger_${result.certification_result_id}`,
    certification_result_id: result.certification_result_id,
    certification_request_id: result.certification_request_id,
    tenant_id: result.tenant_id,
    mission_id: result.mission_id,
    certification_scope: result.certification_scope,
    state: result.state,
    target_record_ids: input.target_record_ids,
    target_chain_ids: input.target_chain_ids,
    verification_result_ids: result.verification_result_ids,
    finding_refs: findingRefs(input, []),
    passed_categories: result.passed_categories,
    degraded_categories: result.degraded_categories,
    failed_categories: result.failed_categories,
    certification_allowed: result.certification_allowed,
    conditional_certification_allowed: result.conditional_certification_allowed,
    replay_allowed: result.replay_allowed,
    operator_review_required: result.operator_review_required,
    governance_review_required: result.governance_review_required,
    escalation_required: result.escalation_required,
    blocking_reasons: result.blocking_reasons,
    warnings: result.warnings,
    rationale: result.rationale,
    result_hash: result.result_hash,
    previous_certification_hash: previousCertificationHash,
    created_at: result.certified_at,
    appendOnly: true,
    sourceMutationAllowed: false,
  });
}

export function toTruthIntegrityCertificationOperatorVisibilityReport(
  result: TruthIntegrityCertificationGateResult,
  previousCertificationHash?: string,
): TruthIntegrityCertificationOperatorVisibilityReport {
  return Object.freeze({
    certification_result_id: result.certification_result_id,
    summary: `Integrity certification ${result.state} for ${result.certification_scope}.`,
    certification_state: result.state,
    certification_scope: result.certification_scope,
    tenant_id: result.tenant_id,
    mission_id: result.mission_id,
    valid_targets: result.valid_targets,
    degraded_targets: result.degraded_targets,
    corrupted_targets: result.corrupted_targets,
    blocking_reasons: result.blocking_reasons,
    warnings: result.warnings,
    replay_status: result.state === "VALID" ? "ALLOWED" : result.state === "DEGRADED" ? "LIMITED" : "BLOCKED",
    governance_status: result.governance_review_required ? "REVIEW_REQUIRED" : "CLEAR",
    escalation_status: result.escalation_required ? "ESCALATION_REQUIRED" : "NONE",
    result_hash: result.result_hash,
    previous_certification_hash: previousCertificationHash,
  });
}
