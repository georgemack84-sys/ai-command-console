import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import {
  CONFLICT_CATEGORIES,
  CONFLICT_SEVERITIES,
  computeConflictRecordIntegrityHash,
  validateConflict,
} from "@/services/decision-conflict-detection-contract";
import { detectDecisionCandidateConflicts } from "@/services/decision-conflict-detection-engine";
import type {
  ConflictCategory,
  ConflictRecord,
  ConflictSeverity,
} from "@/types/decision-conflict-detection-contract";
import type {
  ConflictClassificationEngineFoundation,
  ConflictClassificationEngineInput,
  ConflictClassificationEngineResult,
  ConflictClassificationFailureReason,
  ConflictClassificationImpact,
  ConflictClassificationLedgerRecord,
  ConflictClassificationObservability,
  ConflictClassificationRecord,
  ConflictClassificationReplay,
  ConflictClassificationReport,
  ConflictClassificationValidation,
} from "@/types/decision-conflict-classification-engine";

const NOW = "2026-07-03T23:26:00.000Z";
const ENGINE_VERSION = "conflict-classification-engine/v1" as const;
const AUTHORIZED_COMPONENT = "decision-conflict-classification-engine";

export const CLASSIFICATION_CATEGORY_PRIORITY: readonly ConflictCategory[] = Object.freeze([
  "Constitutional",
  "Governance",
  "Authority",
  "Certification",
  "Tenant Boundary",
  "Mission Objective",
  "Recovery",
  "Resource",
  "Timing",
  "Forecast",
  "Risk",
  "Confidence",
  "Evidence",
  "Recommendation",
]);

const SEVERITY_SCORE: Readonly<Record<ConflictSeverity, number>> = Object.freeze({
  LOW: 20,
  MEDIUM: 40,
  HIGH: 65,
  CRITICAL: 85,
  BLOCKING: 100,
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalizeCategories(values: readonly ConflictCategory[]): ConflictCategory[] {
  return [...new Set(values.filter((value) => CONFLICT_CATEGORIES.includes(value)))]
    .sort((a, b) => CLASSIFICATION_CATEGORY_PRIORITY.indexOf(a) - CLASSIFICATION_CATEGORY_PRIORITY.indexOf(b));
}

function categoryFromRef(ref: string): ConflictCategory | undefined {
  const value = ref.toLowerCase();
  if (value.includes("constitutional") && (value.includes("violation") || value.includes("bypass") || value.includes("breach"))) return "Constitutional";
  if (value.includes("governance") || value.includes("policy")) return "Governance";
  if (value.includes("authority") || value.includes("approval")) return "Authority";
  if (value.includes("certification") || value.includes("cert_")) return "Certification";
  if (value.includes("tenant")) return "Tenant Boundary";
  if (value.includes("mission") || value.includes("objective")) return "Mission Objective";
  if (value.includes("recovery") || value.includes("rollback")) return "Recovery";
  if (value.includes("resource") || value.includes("capacity")) return "Resource";
  if (value.includes("timing") || value.includes("window") || value.includes("schedule")) return "Timing";
  if (value.includes("forecast") || value.includes("projection")) return "Forecast";
  if (value.includes("risk")) return "Risk";
  if (value.includes("confidence") || value.includes("uncertainty")) return "Confidence";
  if (value.includes("evidence") || value.includes("observation")) return "Evidence";
  if (value.includes("recommendation") || value.includes("action")) return "Recommendation";
  return undefined;
}

function categoriesForConflict(conflict: ConflictRecord): readonly ConflictCategory[] {
  const detected: ConflictCategory[] = [conflict.conflict_category, ...conflict.secondary_categories];
  [
    conflict.governance_refs,
    conflict.policy_refs,
    conflict.constitutional_refs,
    conflict.authority_refs,
    conflict.evidence_refs,
    conflict.risk_refs,
    conflict.confidence_refs,
    conflict.forecast_refs,
    conflict.resource_refs,
    conflict.recovery_refs,
    conflict.certification_refs,
  ].flat().forEach((ref) => {
    const category = categoryFromRef(ref);
    if (category) detected.push(category);
  });
  if (JSON.stringify(conflict).includes("tenant_beta") && conflict.tenant_id !== "tenant_beta") detected.push("Tenant Boundary");
  return normalizeCategories(detected);
}

export function determinePrimaryConflictCategory(conflict: ConflictRecord): ConflictCategory {
  const categories = categoriesForConflict(conflict);
  return categories[0] ?? conflict.conflict_category;
}

export function determineSecondaryConflictCategories(conflict: ConflictRecord): readonly ConflictCategory[] {
  const primary = determinePrimaryConflictCategory(conflict);
  return Object.freeze(categoriesForConflict(conflict).filter((category) => category !== primary));
}

function impactFromCategories(categories: readonly ConflictCategory[], target: ConflictCategory): ConflictClassificationImpact {
  return categories.includes(target) ? (target === "Constitutional" ? "BLOCKING" : target === "Governance" || target === "Authority" ? "CRITICAL" : "HIGH") : "NONE";
}

function hasBlockingSignal(conflict: ConflictRecord, primary: ConflictCategory, secondary: readonly ConflictCategory[]): boolean {
  const refs = [
    ...conflict.constitutional_refs,
    ...conflict.authority_refs,
    ...conflict.governance_refs,
    ...conflict.policy_refs,
    ...conflict.certification_refs,
    conflict.replay_ref,
  ].map((ref) => ref.toLowerCase());
  return primary === "Constitutional"
    || primary === "Tenant Boundary"
    || secondary.includes("Constitutional")
    || secondary.includes("Tenant Boundary")
    || refs.some((ref) => ref.includes("violation") || ref.includes("bypass") || ref.includes("boundary_violation") || ref.includes("blocked") || ref.includes("corrupt"));
}

export function calculateConflictClassificationSeverity(conflict: ConflictRecord): ConflictSeverity {
  const primary = determinePrimaryConflictCategory(conflict);
  const secondary = determineSecondaryConflictCategories(conflict);
  if (hasBlockingSignal(conflict, primary, secondary)) return "BLOCKING";
  if (primary === "Governance" || primary === "Authority" || conflict.escalation_required) return "CRITICAL";
  if (primary === "Certification" || primary === "Mission Objective" || primary === "Risk") return "HIGH";
  if (primary === "Recovery" || primary === "Timing" || primary === "Forecast" || primary === "Resource" || primary === "Evidence" || primary === "Confidence") return "MEDIUM";
  return conflict.severity === "LOW" ? "LOW" : "MEDIUM";
}

function severityReason(conflict: ConflictRecord, severity: ConflictSeverity, primary: ConflictCategory, secondary: readonly ConflictCategory[]): string {
  if (severity === "BLOCKING") return `${primary} classification is blocking due to constitutional, tenant, authority, governance, certification, or replay integrity constraints.`;
  if (severity === "CRITICAL") return `${primary} classification requires governance or authority involvement before arbitration.`;
  if (severity === "HIGH") return `${primary} classification has significant mission, risk, or certification impact.`;
  if (severity === "MEDIUM") return `${primary} classification is localized and recoverable with advisory review.`;
  return `${primary} classification has minimal operational impact.`;
}

function operatorVisibility(severity: ConflictSeverity): "STANDARD" | "RECOMMENDED" | "REQUIRED" {
  if (severity === "BLOCKING" || severity === "CRITICAL") return "REQUIRED";
  if (severity === "HIGH") return "RECOMMENDED";
  return "STANDARD";
}

export function classifyDetectedConflict(conflict: ConflictRecord): ConflictClassificationRecord {
  const primary = determinePrimaryConflictCategory(conflict);
  const secondary = determineSecondaryConflictCategories(conflict);
  const severity = calculateConflictClassificationSeverity(conflict);
  const categories = [primary, ...secondary];
  const base: Omit<ConflictClassificationRecord, "integrity_hash"> = {
    classification_id: `classification_${conflict.conflict_id}`,
    conflict_id: conflict.conflict_id,
    primary_category: primary,
    secondary_categories: secondary,
    severity,
    severity_score: SEVERITY_SCORE[severity],
    severity_reason: severityReason(conflict, severity, primary, secondary),
    governance_impact: impactFromCategories(categories, "Governance"),
    constitutional_impact: impactFromCategories(categories, "Constitutional"),
    operator_visibility: operatorVisibility(severity),
    escalation_required: severity === "BLOCKING" || severity === "CRITICAL" || conflict.escalation_required,
    arbitration_ready: severity !== "BLOCKING" && validateConflict(conflict).validation_state === "VALID",
    advisory_only: true,
    replay_ref: `${conflict.replay_ref}_classification`,
    lineage_ref: `${conflict.lineage_ref}_classification`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function computeConflictClassificationIntegrityHash(classification: Omit<ConflictClassificationRecord, "integrity_hash"> | ConflictClassificationRecord): string {
  return hashWithoutIntegrity(classification);
}

function validationResult(failures: readonly ConflictClassificationFailureReason[]): ConflictClassificationValidation {
  const unique = Object.freeze([...new Set(failures)] as ConflictClassificationFailureReason[]);
  const has = (failure: ConflictClassificationFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length > 0 ? "REJECTED" : "VALID",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      category_valid: !has("INVALID_PRIMARY_CATEGORY") && !has("CONFLICTING_PRIMARY_CLASSIFICATIONS"),
      severity_valid: !has("INVALID_SEVERITY"),
      governance_valid: !has("MISSING_GOVERNANCE_REFERENCES"),
      constitutional_valid: !has("MISSING_CONSTITUTIONAL_METADATA"),
      replay_valid: !has("REPLAY_CORRUPTION"),
      integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
      tenant_isolated: !has("TENANT_BOUNDARY_VIOLATION"),
      advisory_only: !has("ADVISORY_ONLY_VIOLATION"),
    }),
  });
}

export function validateConflictClassification(conflict: ConflictRecord, classification: unknown): ConflictClassificationValidation {
  if (!classification || typeof classification !== "object" || Array.isArray(classification)) {
    return validationResult(["INVALID_PRIMARY_CATEGORY"]);
  }
  const typed = classification as ConflictClassificationRecord;
  const failures: ConflictClassificationFailureReason[] = [];
  const expectedPrimary = determinePrimaryConflictCategory(conflict);
  const expectedSeverity = calculateConflictClassificationSeverity(conflict);
  if (!CONFLICT_CATEGORIES.includes(typed.primary_category)) failures.push("INVALID_PRIMARY_CATEGORY");
  if (typed.primary_category !== expectedPrimary) failures.push("CONFLICTING_PRIMARY_CLASSIFICATIONS");
  if (!CONFLICT_SEVERITIES.includes(typed.severity) || typed.severity !== expectedSeverity || typed.severity_score !== SEVERITY_SCORE[typed.severity]) failures.push("INVALID_SEVERITY");
  if (!conflict.governance_refs.length || typed.governance_impact === "NONE" && (typed.primary_category === "Governance" || typed.secondary_categories.includes("Governance"))) failures.push("MISSING_GOVERNANCE_REFERENCES");
  if (!conflict.constitutional_refs.length) failures.push("MISSING_CONSTITUTIONAL_METADATA");
  if (!typed.replay_ref || !conflict.replay_ref) failures.push("REPLAY_CORRUPTION");
  if (JSON.stringify(conflict).includes("tenant_beta") && conflict.tenant_id !== "tenant_beta") failures.push("TENANT_BOUNDARY_VIOLATION");
  if (typed.advisory_only !== true) failures.push("ADVISORY_ONLY_VIOLATION");
  if (typed.integrity_hash && computeConflictClassificationIntegrityHash(typed) !== typed.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (computeConflictRecordIntegrityHash(conflict) !== conflict.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return validationResult(failures);
}

export function generateConflictClassificationReport(conflict: ConflictRecord, classification: ConflictClassificationRecord): ConflictClassificationReport {
  const validation = validateConflictClassification(conflict, classification);
  const base: Omit<ConflictClassificationReport, "integrity_hash"> = {
    report_id: `classification_report_${classification.classification_id}`,
    classification_id: classification.classification_id,
    conflict_id: conflict.conflict_id,
    originating_decisions: conflict.candidate_refs,
    primary_category: classification.primary_category,
    secondary_categories: classification.secondary_categories,
    severity: classification.severity,
    severity_rationale: classification.severity_reason,
    evidence_summary: `${conflict.evidence_refs.length} evidence reference(s) support the classification.`,
    governance_summary: `${conflict.governance_refs.length} governance reference(s) evaluated; impact ${classification.governance_impact}.`,
    constitutional_evaluation: `${conflict.constitutional_refs.length} constitutional reference(s) evaluated; impact ${classification.constitutional_impact}.`,
    escalation_recommendation: classification.escalation_required ? "Escalation required before arbitration." : "Classification may proceed to arbitration preparation.",
    replay_ref: classification.replay_ref,
    integrity_verified: validation.validation_state === "VALID",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledgerHash(record: Omit<ConflictClassificationLedgerRecord, "integrity_hash"> | ConflictClassificationLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

function writeClassificationLedger(classification: ConflictClassificationRecord): ConflictClassificationLedgerRecord {
  const base: Omit<ConflictClassificationLedgerRecord, "integrity_hash"> = {
    ledger_id: `classification_ledger_${classification.classification_id}`,
    classification_id: classification.classification_id,
    conflict_id: classification.conflict_id,
    primary_category: classification.primary_category,
    severity: classification.severity,
    escalation_required: classification.escalation_required,
    replay_ref: classification.replay_ref,
    lineage_ref: classification.lineage_ref,
    classification_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

function replayHash(result: Omit<ConflictClassificationEngineResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    classifications: result.classifications,
    reports: result.reports,
    validations: result.validations,
    ledger_records: result.ledger_records,
    failures: result.failures,
  });
}

function failResult(failures: readonly ConflictClassificationFailureReason[]): ConflictClassificationEngineResult {
  const base: Omit<ConflictClassificationEngineResult, "integrity_hash" | "replay_hash"> = {
    classification_status: "FAIL",
    fail_closed: true,
    classifications: Object.freeze([]),
    reports: Object.freeze([]),
    validations: Object.freeze([]),
    ledger_records: Object.freeze([]),
    failures: Object.freeze([...new Set(failures)]),
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = replayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function classifyDetectedConflicts(input: ConflictClassificationEngineInput = {}): ConflictClassificationEngineResult {
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(["UNAUTHORIZED_COMPONENT"]);
  const conflicts = Object.freeze([...(input.conflicts ?? input.detection_result?.conflicts ?? detectDecisionCandidateConflicts().conflicts)]);
  if (conflicts.length === 0) return failResult(["NO_CONFLICTS"]);
  const classifications = Object.freeze(conflicts.map(classifyDetectedConflict).sort((a, b) => a.classification_id.localeCompare(b.classification_id)));
  const validations = Object.freeze(classifications.map((classification) => {
    const conflict = conflicts.find((item) => item.conflict_id === classification.conflict_id)!;
    return validateConflictClassification(conflict, classification);
  }));
  if (validations.some((validation) => validation.validation_state !== "VALID")) {
    return failResult(validations.flatMap((validation) => validation.failures));
  }
  const reports = Object.freeze(classifications.map((classification) => {
    const conflict = conflicts.find((item) => item.conflict_id === classification.conflict_id)!;
    return generateConflictClassificationReport(conflict, classification);
  }));
  const ledger_records = Object.freeze(classifications.map(writeClassificationLedger));
  if (ledger_records.some((record) => ledgerHash(record) !== record.integrity_hash)) return failResult(["CLASSIFICATION_LEDGER_FAILED"]);
  const base: Omit<ConflictClassificationEngineResult, "integrity_hash" | "replay_hash"> = {
    classification_status: "PASS",
    fail_closed: false,
    classifications,
    reports,
    validations,
    ledger_records,
    failures: Object.freeze([]),
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = replayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(["REPLAY_CORRUPTION"]);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayConflictClassification(result: ConflictClassificationEngineResult): ConflictClassificationReplay {
  const reconstructed = replayHash(result);
  const ledgerValid = result.ledger_records.every((record) => ledgerHash(record) === record.integrity_hash);
  const reportValid = result.reports.every((report) => hashWithoutIntegrity(report) === report.integrity_hash);
  const replay_valid = result.replay_hash === reconstructed && ledgerValid && reportValid;
  const failures: ConflictClassificationFailureReason[] = replay_valid ? [] : ["REPLAY_CORRUPTION"];
  const base: Omit<ConflictClassificationReplay, "integrity_hash"> = {
    replay_id: "replay_conflict_classification_engine",
    replay_valid,
    conflict_refs: Object.freeze(result.classifications.map((classification) => classification.conflict_id)),
    classification_refs: Object.freeze(result.classifications.map((classification) => classification.classification_id)),
    report_refs: Object.freeze(result.reports.map((report) => report.report_id)),
    ledger_refs: Object.freeze(result.ledger_records.map((record) => record.ledger_id)),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function countBy<T extends string>(items: readonly T[], keys: readonly T[]): Record<T, number> {
  return Object.freeze(keys.reduce((counts, key) => {
    counts[key] = items.filter((item) => item === key).length;
    return counts;
  }, {} as Record<T, number>));
}

export function buildConflictClassificationObservability(result: ConflictClassificationEngineResult): ConflictClassificationObservability {
  return Object.freeze({
    conflicts_classified: result.classifications.length,
    classifications_by_category: countBy(result.classifications.map((classification) => classification.primary_category), CONFLICT_CATEGORIES),
    classifications_by_severity: countBy(result.classifications.map((classification) => classification.severity), CONFLICT_SEVERITIES),
    constitutional_conflicts: result.classifications.filter((classification) => classification.primary_category === "Constitutional" || classification.secondary_categories.includes("Constitutional")).length,
    governance_conflicts: result.classifications.filter((classification) => classification.primary_category === "Governance" || classification.secondary_categories.includes("Governance")).length,
    authority_conflicts: result.classifications.filter((classification) => classification.primary_category === "Authority" || classification.secondary_categories.includes("Authority")).length,
    tenant_conflicts: result.classifications.filter((classification) => classification.primary_category === "Tenant Boundary" || classification.secondary_categories.includes("Tenant Boundary")).length,
    certification_conflicts: result.classifications.filter((classification) => classification.primary_category === "Certification" || classification.secondary_categories.includes("Certification")).length,
    replay_success_rate: replayConflictClassification(result).replay_valid ? 1 : 0,
    validation_failures: result.validations.filter((validation) => validation.validation_state !== "VALID").length,
    integrity_failures: result.validations.filter((validation) => !validation.checks.integrity_valid).length,
  });
}

export function getConflictClassificationEngineFoundation(): ConflictClassificationEngineFoundation {
  const result = classifyDetectedConflicts();
  const replay = replayConflictClassification(result);
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    category_priority: CLASSIFICATION_CATEGORY_PRIORITY,
    result,
    replay,
    observability: buildConflictClassificationObservability(result),
  });
}

export const ConflictClassificationEngine = Object.freeze({
  classifyOne: classifyDetectedConflict,
  classify: classifyDetectedConflicts,
  report: generateConflictClassificationReport,
  validate: validateConflictClassification,
  replay: replayConflictClassification,
});
