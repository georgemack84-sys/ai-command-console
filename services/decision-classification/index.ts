import crypto from "crypto";
import { createDecisionInput, DECISION_SCHEMA_TYPES, validateDecisionInputSchema } from "@/services/decision-schema";
import type { DecisionInput, DecisionType } from "@/types/decision-schema";
import type {
  DecisionBehavioralProfile,
  DecisionClassificationFailure,
  DecisionClassificationInput,
  DecisionClassificationObservability,
  DecisionClassificationRecord,
  DecisionClassificationResult,
  DecisionClassificationValidationResult,
  DecisionTaxonomyValidationResult,
  DecisionTaxonomyVersion,
} from "@/types/decision-classification";

const NOW = "2026-07-02T09:13:00.000Z";
const TAXONOMY_VERSION: DecisionTaxonomyVersion = "decision-taxonomy/v9.1.3";
const CATEGORY_DESCRIPTIONS: Readonly<Record<DecisionType, string>> = Object.freeze({
  PLAN_SELECTION: "Select the optimal mission execution strategy from validated alternatives.",
  RECOMMENDATION_SELECTION: "Choose among advisory recommendations.",
  RISK_RESPONSE: "Determine response to identified operational or strategic risks.",
  RECOVERY_OPTION: "Select deterministic recovery strategy after detected failures.",
  GOVERNANCE_ESCALATION: "Escalate governance conflicts for operator or policy resolution.",
  POLICY_CONFLICT: "Resolve conflicts between applicable governance policies.",
  MISSION_HEALTH_ACTION: "Recommend interventions based on mission health intelligence.",
  FORECAST_RESPONSE: "Respond to predictive intelligence outcomes.",
  OPERATOR_INTERVENTION: "Handle operator-directed decisions.",
  CERTIFICATION_DECISION: "Determine certification outcomes for components or phases.",
  CONTINUATION_DECISION: "Decide whether mission execution should proceed.",
  DEFERRAL_DECISION: "Defer a decision until information or approval is available.",
});

const PRODUCES: Readonly<Record<DecisionType, readonly string[]>> = Object.freeze({
  PLAN_SELECTION: Object.freeze(["selected plan", "rejected plans", "rationale", "replay references"]),
  RECOMMENDATION_SELECTION: Object.freeze(["selected recommendation", "rejected recommendations", "confidence rationale", "implementation guidance"]),
  RISK_RESPONSE: Object.freeze(["mitigation recommendation", "escalation decision", "monitoring strategy", "residual risk assessment"]),
  RECOVERY_OPTION: Object.freeze(["recovery recommendation", "recovery priority", "replay validation", "rollback guidance"]),
  GOVERNANCE_ESCALATION: Object.freeze(["escalation package", "governing policy references", "approval requirements", "compliance rationale"]),
  POLICY_CONFLICT: Object.freeze(["conflict analysis", "applicable policies", "recommended resolution", "constitutional justification"]),
  MISSION_HEALTH_ACTION: Object.freeze(["health recommendation", "degradation analysis", "recovery priority", "trend references"]),
  FORECAST_RESPONSE: Object.freeze(["forecast interpretation", "mitigation recommendation", "confidence explanation", "simulation references"]),
  OPERATOR_INTERVENTION: Object.freeze(["operator action", "approval record", "override rationale", "audit references"]),
  CERTIFICATION_DECISION: Object.freeze(["certification result", "supporting evidence", "replay validation", "compliance summary"]),
  CONTINUATION_DECISION: Object.freeze(["continue recommendation", "pause recommendation", "suspend recommendation", "terminate recommendation"]),
  DEFERRAL_DECISION: Object.freeze(["deferral reason", "outstanding requirements", "review timeline", "re-evaluation trigger"]),
});

const INHERITED_GUARANTEES = Object.freeze(["governance validation", "constitutional validation", "replay requirements", "lineage requirements", "integrity requirements", "tenant isolation", "advisory-only behavior", "fail-closed enforcement"] as const);
const AUTHORITY_BOUNDARIES = Object.freeze(["may evaluate", "may compare", "may classify", "may prioritize", "may recommend", "may explain", "may escalate", "must not execute actions", "must not modify governance", "must not alter constitutional rules", "must not bypass operators", "must not self-certify", "must not self-authorize", "must not mutate classification rules"] as const);

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().filter((key) => record[key] !== undefined).map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashValue(value: unknown): string {
  return crypto.createHash("sha256").update(canonicalize(value), "utf8").digest("hex");
}

function id(category: DecisionType): string {
  return `DCR-9-1-3-${category}`;
}

function behavioralProfile(category: DecisionType): DecisionBehavioralProfile {
  return Object.freeze({
    required_inputs: Object.freeze(["decision input schema", "evidence references", "governance references", "constitutional references", "replay references", "lineage references"]),
    produces: PRODUCES[category],
    required_evidence: Object.freeze(["category evidence", "decision subject evidence", "schema validation evidence"]),
    required_governance_checks: Object.freeze(["governance profile assigned", "policy references present", "approval rules inherited"]),
    required_constitutional_checks: Object.freeze(["constitutional profile assigned", "operator supremacy preserved", "advisory-only rule enforced"]),
    replay_behavior: "Classification replays by validated decision_type and taxonomy version.",
    operator_approval_required: ["GOVERNANCE_ESCALATION", "OPERATOR_INTERVENTION", "CERTIFICATION_DECISION", "CONTINUATION_DECISION", "DEFERRAL_DECISION"].includes(category),
    authority_boundaries: AUTHORITY_BOUNDARIES,
    explainability_requirements: Object.freeze(["category purpose", "required inputs", "produced outputs", "governance inheritance", "constitutional inheritance"]),
    confidence_expectations: Object.freeze(["classification is deterministic", "no probabilistic category assignment", "ambiguous primary categories fail closed"]),
    audit_requirements: Object.freeze(["classification id", "taxonomy version", "input orchestration id", "integrity hash"]),
  });
}

function makeRecord(category: DecisionType, overrides: Partial<DecisionClassificationRecord> = {}): DecisionClassificationRecord {
  const base: Omit<DecisionClassificationRecord, "integrity_hash"> = {
    classification_id: overrides.classification_id ?? id(category),
    category_name: overrides.category_name ?? category,
    category_description: overrides.category_description ?? CATEGORY_DESCRIPTIONS[category],
    behavioral_profile: overrides.behavioral_profile ?? behavioralProfile(category),
    authority_level: overrides.authority_level ?? "ADVISORY_ONLY",
    governance_requirements: overrides.governance_requirements ?? Object.freeze(["governance profile assigned", "policy references required", "operator approval rules inherited"]),
    constitutional_requirements: overrides.constitutional_requirements ?? Object.freeze(["constitutional profile assigned", "operator supremacy required", "advisory-only compliance required"]),
    replay_requirements: overrides.replay_requirements ?? Object.freeze(["taxonomy version fixed", "decision_type fixed", "classification hash reproducible"]),
    lineage_requirements: overrides.lineage_requirements ?? Object.freeze(["classification lineage recorded", "category registry version preserved"]),
    validation_profile: overrides.validation_profile ?? Object.freeze(["category exists", "category active", "profiles complete", "exactly one primary category"]),
    lifecycle_profile: overrides.lifecycle_profile ?? Object.freeze(["CREATED", "VALIDATING", "READY_FOR_ORCHESTRATION", "ORCHESTRATED", "OPERATOR_VISIBLE", "ARCHIVED"]),
    version: overrides.version ?? TAXONOMY_VERSION,
    status: overrides.status ?? "ACTIVE",
    created_at: overrides.created_at ?? NOW,
  };
  return Object.freeze({ ...base, integrity_hash: overrides.integrity_hash ?? hashValue(base) });
}

export const DECISION_CLASSIFICATION_REGISTRY: Readonly<Record<DecisionType, DecisionClassificationRecord>> = Object.freeze(
  DECISION_SCHEMA_TYPES.reduce((registry, category) => ({ ...registry, [category]: makeRecord(category) }), {} as Record<DecisionType, DecisionClassificationRecord>),
);

export function getDecisionClassification(category: DecisionType | string): DecisionClassificationRecord | undefined {
  return DECISION_CLASSIFICATION_REGISTRY[category as DecisionType];
}

export function resolveBehaviorProfile(category: DecisionType | string): DecisionBehavioralProfile | undefined {
  return getDecisionClassification(category)?.behavioral_profile;
}

function recordFailures(record: DecisionClassificationRecord | undefined): readonly DecisionClassificationFailure[] {
  if (!record) return Object.freeze(["CATEGORY_UNDEFINED"] as const);
  return Object.freeze([
    ...(record.version !== TAXONOMY_VERSION ? ["UNSUPPORTED_TAXONOMY_VERSION" as const] : []),
    ...(record.status !== "ACTIVE" ? ["CATEGORY_INACTIVE" as const] : []),
    ...(!record.behavioral_profile || record.behavioral_profile.required_inputs.length === 0 ? ["BEHAVIORAL_PROFILE_MISSING" as const] : []),
    ...(record.governance_requirements.length === 0 ? ["GOVERNANCE_PROFILE_MISSING" as const] : []),
    ...(record.constitutional_requirements.length === 0 ? ["CONSTITUTIONAL_PROFILE_MISSING" as const] : []),
    ...(record.replay_requirements.length === 0 ? ["REPLAY_PROFILE_MISSING" as const] : []),
    ...(record.lineage_requirements.length === 0 ? ["LINEAGE_PROFILE_MISSING" as const] : []),
    ...(record.authority_level !== "ADVISORY_ONLY" ? ["AUTHORITY_PROFILE_MISSING" as const] : []),
    ...(record.integrity_hash !== hashValue({ ...record, integrity_hash: undefined }) ? ["INTEGRITY_HASH_MISMATCH" as const] : []),
  ]);
}

function scenarioRecord(category: DecisionType, scenario: DecisionClassificationInput["scenario"]): DecisionClassificationRecord | undefined {
  const record = getDecisionClassification(category);
  if (!record) return undefined;
  if (scenario === "INACTIVE_CATEGORY") return makeRecord(category, { status: "INACTIVE" });
  if (scenario === "MISSING_BEHAVIOR") return makeRecord(category, { behavioral_profile: Object.freeze({ ...record.behavioral_profile, required_inputs: Object.freeze([]) }) });
  if (scenario === "MISSING_GOVERNANCE") return makeRecord(category, { governance_requirements: Object.freeze([]) });
  if (scenario === "MISSING_CONSTITUTIONAL") return makeRecord(category, { constitutional_requirements: Object.freeze([]) });
  if (scenario === "MISSING_REPLAY") return makeRecord(category, { replay_requirements: Object.freeze([]) });
  if (scenario === "INTEGRITY_FAILURE") return Object.freeze({ ...record, integrity_hash: "tampered" });
  return record;
}

export function classifyDecision(input: DecisionClassificationInput = {}): DecisionClassificationResult {
  const decisionInput: DecisionInput = input.decision_input ?? createDecisionInput({ decision_type: "RECOMMENDATION_SELECTION" });
  const category = (input.scenario === "UNDEFINED_CATEGORY" ? "UNDEFINED_CATEGORY" : input.category ?? decisionInput.decision_type) as DecisionType;
  const record = scenarioRecord(category, input.scenario) ?? makeRecord("DEFERRAL_DECISION", { category_name: category, status: "INACTIVE" });
  const related = Object.freeze([...(input.related_categories ?? [])].filter((item) => item !== category) as DecisionType[]);
  const base = {
    classification_id: record.classification_id,
    orchestration_id: decisionInput.orchestration_id,
    tenant_id: input.scenario === "TENANT_LEAK" ? "tenant_beta" : decisionInput.tenant_id,
    mission_id: decisionInput.mission_id,
    primary_category: category,
    related_categories: input.scenario === "DUPLICATE_PRIMARY" ? Object.freeze([category]) : related,
    taxonomy_version: (input.taxonomy_version ?? TAXONOMY_VERSION) as DecisionTaxonomyVersion,
    record,
    inherited_guarantees: INHERITED_GUARANTEES,
    advisory_only: true as const,
    execution_authorized: false as const,
    governance_modification_authorized: false as const,
    constitutional_modification_authorized: false as const,
    operator_bypass_authorized: false as const,
    self_authorization_allowed: false as const,
  };
  const violated = input.scenario === "ADVISORY_ONLY_VIOLATION";
  return Object.freeze({ ...base, execution_authorized: violated as false, classification_hash: hashValue(base) });
}

export function validateDecisionClassification(classification: DecisionClassificationResult | DecisionClassificationRecord | undefined, sourceInput?: DecisionInput): DecisionClassificationValidationResult {
  const record = classification && "record" in classification ? classification.record : classification;
  const failures: DecisionClassificationFailure[] = [...recordFailures(record)];
  if (!classification) failures.push("CATEGORY_UNDEFINED");
  if (classification && "record" in classification) {
    const schemaValidation = sourceInput ? validateDecisionInputSchema(sourceInput) : { validation_status: "VALID" };
    if (schemaValidation.validation_status !== "VALID") failures.push("DECISION_INPUT_INVALID");
    if (!getDecisionClassification(classification.primary_category)) failures.push("CATEGORY_UNDEFINED");
    if (classification.taxonomy_version !== TAXONOMY_VERSION) failures.push("UNSUPPORTED_TAXONOMY_VERSION");
    if (classification.related_categories.includes(classification.primary_category)) failures.push("DUPLICATE_PRIMARY_CLASSIFICATION", "CLASSIFICATION_AMBIGUITY");
    if (sourceInput && classification.tenant_id !== sourceInput.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
    if (!classification.advisory_only || classification.execution_authorized || classification.governance_modification_authorized || classification.constitutional_modification_authorized || classification.operator_bypass_authorized || classification.self_authorization_allowed) failures.push("ADVISORY_ONLY_VIOLATION");
    if (classification.classification_hash !== hashValue({ ...classification, classification_hash: undefined })) failures.push("INTEGRITY_HASH_MISMATCH");
  }
  const unique = Object.freeze([...new Set(failures)]);
  const has = (failure: DecisionClassificationFailure) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length ? "FAILED_CLOSED" : "VALID",
    classification_id: record?.classification_id,
    failures: unique,
    checks: Object.freeze({
      category_exists: !has("CATEGORY_UNDEFINED"),
      category_supported: !has("CATEGORY_UNDEFINED") && !has("UNSUPPORTED_TAXONOMY_VERSION"),
      category_active: !has("CATEGORY_INACTIVE"),
      metadata_present: Boolean(record?.classification_id && record?.category_name && record?.version && record?.created_at),
      behavioral_profile_complete: !has("BEHAVIORAL_PROFILE_MISSING"),
      governance_profile_assigned: !has("GOVERNANCE_PROFILE_MISSING"),
      constitutional_profile_assigned: !has("CONSTITUTIONAL_PROFILE_MISSING"),
      replay_profile_assigned: !has("REPLAY_PROFILE_MISSING"),
      lineage_profile_assigned: !has("LINEAGE_PROFILE_MISSING"),
      authority_profile_assigned: !has("AUTHORITY_PROFILE_MISSING"),
      exactly_one_primary_category: !has("DUPLICATE_PRIMARY_CLASSIFICATION") && !has("CLASSIFICATION_AMBIGUITY"),
      tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"),
      advisory_only_enforced: !has("ADVISORY_ONLY_VIOLATION"),
      integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
    }),
  });
}

export function validateDecisionTaxonomy(registry = DECISION_CLASSIFICATION_REGISTRY): DecisionTaxonomyValidationResult {
  const categories = Object.keys(registry) as DecisionType[];
  const failures = [
    ...(categories.length !== DECISION_SCHEMA_TYPES.length ? ["CATEGORY_UNDEFINED" as const] : []),
    ...categories.flatMap((category) => validateDecisionClassification(registry[category]).failures),
  ];
  const unique = Object.freeze([...new Set(failures)]);
  return Object.freeze({ taxonomy_version: TAXONOMY_VERSION, valid: unique.length === 0, category_count: categories.length, failures: unique });
}

export function buildDecisionClassificationObservability(classifications: readonly DecisionClassificationResult[]): DecisionClassificationObservability {
  const validations = classifications.map((classification) => validateDecisionClassification(classification));
  return Object.freeze({
    classification_requests: classifications.length,
    category_distribution: Object.freeze(classifications.reduce<Record<string, number>>((counts, classification) => {
      counts[classification.primary_category] = (counts[classification.primary_category] ?? 0) + 1;
      return counts;
    }, {})),
    validation_failures: validations.filter((validation) => validation.validation_state !== "VALID").length,
    undefined_category_attempts: validations.filter((validation) => validation.failures.includes("CATEGORY_UNDEFINED")).length,
    replay_mismatches: validations.filter((validation) => validation.failures.includes("INTEGRITY_HASH_MISMATCH")).length,
    taxonomy_version_usage: Object.freeze(classifications.reduce<Record<string, number>>((counts, classification) => {
      counts[classification.taxonomy_version] = (counts[classification.taxonomy_version] ?? 0) + 1;
      return counts;
    }, {})),
    authority_violations: validations.filter((validation) => validation.failures.includes("ADVISORY_ONLY_VIOLATION")).length,
    governance_validation_failures: validations.filter((validation) => validation.failures.includes("GOVERNANCE_PROFILE_MISSING")).length,
    constitutional_validation_failures: validations.filter((validation) => validation.failures.includes("CONSTITUTIONAL_PROFILE_MISSING")).length,
  });
}

export function getDecisionClassificationFramework() {
  const classification = classifyDecision();
  return Object.freeze({
    taxonomy_version: TAXONOMY_VERSION,
    registry: DECISION_CLASSIFICATION_REGISTRY,
    taxonomy: validateDecisionTaxonomy(),
    classification,
    validation: validateDecisionClassification(classification, createDecisionInput()),
    observability: buildDecisionClassificationObservability([classification]),
  });
}
