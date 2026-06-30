import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateRecommendations } from "@/services/recommendation-generation";
import type { GeneratedRecommendation, RecommendationGenerationPriority } from "@/types/recommendation-generation";
import type {
  AlternativeGovernancePath,
  AlternativePathComparison,
  AlternativePathDoctrine,
  AlternativePathFailureReason,
  AlternativePathGenerationResult,
  AlternativePathLedgerRecord,
  AlternativePathObservabilitySurface,
  AlternativePathReplayResult,
  AlternativePathType,
  AlternativePathValidationFailure,
  AlternativePathValidationResult,
  PathComparisonDimension,
  PathConfidenceBand,
  RecommendationPathScenario,
} from "@/types/recommendation-paths";

const NOW: "2026-06-26T11:00:00.000Z" = "2026-06-26T11:00:00.000Z";
const CONTRACT_VERSION: "ALTERNATIVE-GOVERNANCE-PATHS-V1" = "ALTERNATIVE-GOVERNANCE-PATHS-V1";
const PATH_VERSION: "ALTERNATIVE-PATH-V1" = "ALTERNATIVE-PATH-V1";
const PATH_TYPES: readonly AlternativePathType[] = Object.freeze(["PREFERRED_PATH", "CONSERVATIVE_PATH", "ESCALATION_PATH", "REMEDIATION_PATH"]);
const DIMENSIONS: readonly PathComparisonDimension[] = Object.freeze(["risk_reduction", "residual_risk", "confidence", "evidence_strength", "governance_impact", "compliance_impact", "certification_impact", "operator_burden", "implementation_complexity", "replay_status"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function failure(reason: AlternativePathFailureReason, field_path: string, message: string): AlternativePathValidationFailure {
  return Object.freeze({ failure_id: hashValue("alternative-path-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function tenantLeak(ref: unknown, tenant_id: string | undefined): boolean {
  if (!tenant_id || typeof ref !== "string") return false;
  const match = ref.match(/tenant_(alpha|beta|[0-9]+)/i);
  return Boolean(match && match[0] !== tenant_id);
}

function containsTenantLeak(value: unknown, tenant_id: string | undefined): boolean {
  if (tenantLeak(value, tenant_id)) return true;
  if (Array.isArray(value)) return value.some((item) => containsTenantLeak(item, tenant_id));
  if (isRecord(value)) return Object.values(value).some((item) => containsTenantLeak(item, tenant_id));
  return false;
}

export function buildAlternativePathDoctrine(): AlternativePathDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "evidence-supported", "risk-differentiated", "confidence-scored", "governance-constrained", "advisory-only", "tenant-safe", "truth-ledger-recorded", "replayable", "operator-visible", "fail-closed"] as const),
    path_types: PATH_TYPES,
    lifecycle_states: Object.freeze(["CREATED", "EVIDENCE_BOUND", "RISK_BOUND", "CONFIDENCE_BOUND", "GOVERNANCE_CONSTRAINED", "COMPARISON_READY", "VALIDATED", "REJECTED", "PRESENTED", "SUPERSEDED", "ARCHIVED"] as const),
    contract_version: CONTRACT_VERSION,
  });
}

export function analyzePathRequirements(recommendation: GeneratedRecommendation): readonly AlternativePathType[] {
  const required: AlternativePathType[] = ["PREFERRED_PATH", "CONSERVATIVE_PATH"];
  const highRisk = recommendation.severity_level === "HIGH" || recommendation.severity_level === "CRITICAL" || recommendation.priority === "CRITICAL" || recommendation.priority === "HIGH";
  const escalationType = recommendation.recommendation_type === "ESCALATION_RECOMMENDATION" || recommendation.recommendation_type === "CERTIFICATION_RECOMMENDATION";
  const remediationType = recommendation.recommendation_type === "REMEDIATION_RECOMMENDATION" || recommendation.recommendation_type === "COMPLIANCE_IMPROVEMENT" || recommendation.recommendation_type === "CONTROL_IMPROVEMENT";
  if (highRisk || escalationType || recommendation.constitutional_constraints.length > 0) required.push("ESCALATION_PATH");
  if (remediationType || recommendation.evidence_refs.length < 3) required.push("REMEDIATION_PATH");
  return Object.freeze([...new Set(required)]);
}

function scoreConfidence(pathType: AlternativePathType, recommendation: GeneratedRecommendation, scenario: RecommendationPathScenario): { score: number; band: PathConfidenceBand; hash: string } {
  let score = recommendation.confidence_score;
  if (pathType === "CONSERVATIVE_PATH") score -= 8;
  if (pathType === "ESCALATION_PATH") score -= 3;
  if (pathType === "REMEDIATION_PATH") score -= 10;
  if (scenario === "CONFIDENCE_MISMATCH") score -= 35;
  score = Math.max(0, Math.min(100, score));
  const band: PathConfidenceBand = score >= 90 ? "CERTIFICATION_READY" : score >= 80 ? "HIGH" : score >= 60 ? "MODERATE" : "LOW";
  return Object.freeze({ score, band, hash: hashValue("alternative-path-confidence", { pathType, id: recommendation.recommendation_id, score, band }) });
}

function scorePriority(pathType: AlternativePathType, recommendation: GeneratedRecommendation, scenario: RecommendationPathScenario): RecommendationGenerationPriority {
  if (scenario === "PRIORITY_MISMATCH") return "INFORMATIONAL";
  if (recommendation.priority === "CRITICAL" && pathType === "ESCALATION_PATH") return "CRITICAL";
  if (pathType === "REMEDIATION_PATH" && ["HIGH", "CRITICAL"].includes(recommendation.severity_level)) return "HIGH";
  if (pathType === "PREFERRED_PATH") return recommendation.priority;
  if (pathType === "CONSERVATIVE_PATH") return recommendation.priority === "CRITICAL" ? "HIGH" : "MEDIUM";
  return "HIGH";
}

function riskFor(pathType: AlternativePathType, recommendation: GeneratedRecommendation): { risk: number; introduced: readonly string[]; residual: string; rationale: string } {
  if (pathType === "PREFERRED_PATH") return Object.freeze({ risk: recommendation.risk_score, introduced: Object.freeze(["implementation_complexity"]), residual: "Moderate residual risk until operator action is completed.", rationale: "Preferred path maximizes direct risk reduction while preserving operator action." });
  if (pathType === "CONSERVATIVE_PATH") return Object.freeze({ risk: Math.max(10, recommendation.risk_score - 18), introduced: Object.freeze(["delayed_certification"]), residual: "Lower immediate governance exposure with slower remediation.", rationale: "Conservative path reduces disruption while preserving monitoring and review." });
  if (pathType === "ESCALATION_PATH") return Object.freeze({ risk: Math.max(5, recommendation.risk_score - 10), introduced: Object.freeze(["operator_burden"]), residual: "Risk is transferred to formal governance review.", rationale: "Escalation path addresses high, critical, constitutional, or authority uncertainty." });
  return Object.freeze({ risk: Math.max(10, recommendation.risk_score - 25), introduced: Object.freeze(["verification_delay"]), residual: "Residual risk depends on successful fix and replay.", rationale: "Remediation path targets evidence, lineage, replay, control, or compliance weakness." });
}

export function computePathHash(path: Omit<AlternativeGovernancePath, "path_hash"> | AlternativeGovernancePath): string {
  const { path_hash: _hash, ...source } = path as AlternativeGovernancePath;
  return hashValue("alternative-governance-path", source);
}

function buildPath(recommendation: GeneratedRecommendation, pathType: AlternativePathType, scenario: RecommendationPathScenario): AlternativeGovernancePath {
  const confidence = scoreConfidence(pathType, recommendation, scenario);
  const risk = riskFor(pathType, recommendation);
  const priority = scorePriority(pathType, recommendation, scenario);
  const evidence_refs = scenario === "MISSING_PATH_EVIDENCE" && pathType === "PREFERRED_PATH" ? Object.freeze([]) : recommendation.evidence_refs;
  const replay_refs = scenario === "PATH_REPLAY_MISMATCH" ? Object.freeze([]) : Object.freeze([recommendation.replay_requirements.replay_id, ...recommendation.truth_ledger_requirements.replay_refs]);
  const truth_ledger_refs = scenario === "PATH_LEDGER_FAILURE" ? Object.freeze([]) : recommendation.truth_ledger_refs;
  const withoutHash: Omit<AlternativeGovernancePath, "path_hash"> = {
    path_id: `PATH-7E3-${hashValue("alternative-path-id", { recommendation_id: recommendation.recommendation_id, pathType }).slice(0, 10).toUpperCase()}`,
    recommendation_id: recommendation.recommendation_id,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_beta" : recommendation.tenant_id,
    mission_id: recommendation.mission_id,
    governance_intelligence_id: recommendation.governance_intelligence_id,
    path_type: pathType,
    path_title: `${pathType.replaceAll("_", " ")} for ${recommendation.recommendation_type}`,
    path_summary: `${pathType} provides a governed advisory option for ${recommendation.recommendation_summary}`,
    path_rationale: scenario === "MISSING_RISK_RATIONALE" && pathType === "PREFERRED_PATH" ? "" : risk.rationale,
    path_priority: priority,
    path_confidence: confidence.band,
    path_confidence_score: confidence.score,
    path_risk_score: risk.risk,
    addressed_risks: recommendation.risk_refs,
    introduced_risks: risk.introduced,
    residual_risk: risk.residual,
    evidence_refs,
    policy_refs: recommendation.target_policy_refs,
    compliance_refs: recommendation.target_compliance_refs,
    control_refs: recommendation.target_control_refs,
    governance_constraints: recommendation.governance_constraints,
    constitutional_constraints: recommendation.constitutional_constraints,
    advisory_only: true,
    execution_authority: scenario === "EXECUTION_AUTHORITY" && pathType === "PREFERRED_PATH" ? true as false : false,
    mutation_authority: false,
    approval_authority: false,
    deployment_authority: false,
    operator_action_required: true,
    validation_requirements: Object.freeze(["evidence_bound", "risk_rationale_present", "confidence_reproducible", "priority_reproducible", "governance_constrained", "advisory_only", "tenant_isolated", "replay_ready", "truth_ledger_recorded"]),
    replay_refs,
    truth_ledger_refs,
    ordering_rationale: "Default path order is preferred, conservative, escalation, remediation unless risk, evidence, or replay exceptions apply.",
    created_timestamp: NOW,
    path_version: PATH_VERSION,
    lifecycle_state: "VALIDATED",
  };
  return Object.freeze({ ...withoutHash, path_hash: computePathHash(withoutHash) });
}

function expectedOrdering(paths: readonly AlternativeGovernancePath[]): readonly AlternativePathType[] {
  if (paths.some((path) => path.path_priority === "CRITICAL" && path.path_type === "ESCALATION_PATH")) return Object.freeze(["ESCALATION_PATH", "PREFERRED_PATH", "CONSERVATIVE_PATH", "REMEDIATION_PATH"].filter((type) => paths.some((path) => path.path_type === type)) as AlternativePathType[]);
  if (paths.some((path) => !path.replay_refs.length && path.path_type === "REMEDIATION_PATH")) return Object.freeze(["REMEDIATION_PATH", "PREFERRED_PATH", "CONSERVATIVE_PATH", "ESCALATION_PATH"].filter((type) => paths.some((path) => path.path_type === type)) as AlternativePathType[]);
  if (paths.some((path) => !path.evidence_refs.length && path.path_type === "CONSERVATIVE_PATH")) return Object.freeze(["CONSERVATIVE_PATH", "PREFERRED_PATH", "ESCALATION_PATH", "REMEDIATION_PATH"].filter((type) => paths.some((path) => path.path_type === type)) as AlternativePathType[]);
  return Object.freeze(PATH_TYPES.filter((type) => paths.some((path) => path.path_type === type)));
}

export function orderAlternativePaths(paths: readonly AlternativeGovernancePath[], scenario: RecommendationPathScenario = "BASELINE"): readonly AlternativeGovernancePath[] {
  const ordering = scenario === "ORDERING_MISMATCH" ? Object.freeze([...expectedOrdering(paths)].reverse() as AlternativePathType[]) : expectedOrdering(paths);
  return Object.freeze([...paths].sort((a, b) => ordering.indexOf(a.path_type) - ordering.indexOf(b.path_type) || a.path_id.localeCompare(b.path_id)));
}

export function buildPathComparison(recommendation_id: string, paths: readonly AlternativeGovernancePath[], scenario: RecommendationPathScenario = "BASELINE"): AlternativePathComparison {
  const empty = Object.fromEntries(PATH_TYPES.map((type) => [type, Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, "not generated"]))])) as Record<AlternativePathType, Record<PathComparisonDimension, string>>;
  for (const path of paths) {
    empty[path.path_type] = {
      risk_reduction: path.path_type === "CONSERVATIVE_PATH" ? "Moderate" : path.path_type === "REMEDIATION_PATH" ? "Targeted" : "High",
      residual_risk: path.residual_risk,
      confidence: path.path_confidence,
      evidence_strength: path.evidence_refs.length >= 3 ? "Strong" : "Insufficient",
      governance_impact: path.path_type === "ESCALATION_PATH" ? "Formal review" : "Bounded advisory",
      compliance_impact: path.path_type === "REMEDIATION_PATH" ? "Restores readiness" : "Positive",
      certification_impact: path.path_type === "ESCALATION_PATH" ? "Blocks until review" : path.path_type === "CONSERVATIVE_PATH" ? "Delayed" : "Positive",
      operator_burden: path.path_type === "ESCALATION_PATH" ? "High" : path.path_type === "CONSERVATIVE_PATH" ? "Low" : "Medium",
      implementation_complexity: path.path_type === "CONSERVATIVE_PATH" ? "Low" : "Medium",
      replay_status: path.replay_refs.length ? "Replayable" : "Missing replay",
    };
  }
  const canonicalHash = hashValue("alternative-path-comparison", { recommendation_id, matrix: empty });
  const matrix = scenario === "COMPARISON_MISMATCH" ? { ...empty, PREFERRED_PATH: { ...empty.PREFERRED_PATH, confidence: "tampered" } } : empty;
  return Object.freeze({ comparison_id: `PCOMP-7E3-${hashValue("path-comparison-id", { recommendation_id, matrix: empty }).slice(0, 10).toUpperCase()}`, recommendation_id, dimensions: DIMENSIONS, matrix: Object.freeze(matrix), comparison_rationale: "Comparison differentiates risk reduction, residual risk, confidence, evidence, governance impact, certification impact, operator burden, complexity, and replay status.", comparison_hash: canonicalHash });
}

export function generateAlternativeGovernancePaths(input: { scenario?: RecommendationPathScenario } = {}): AlternativePathGenerationResult {
  const scenario = input.scenario ?? "BASELINE";
  const source_generation = generateRecommendations({ scenario: scenario === "CRITICAL_RISK" ? "ESCALATION_REQUIRED" : scenario === "INCOMPLETE_EVIDENCE" ? "MISSING_EVIDENCE" : scenario === "CROSS_TENANT" ? "CROSS_TENANT" : "BASELINE" });
  const recommendation = source_generation.recommendations[0];
  const required = analyzePathRequirements(recommendation);
  let pathTypes = [...required];
  if (scenario === "MISSING_PREFERRED") pathTypes = pathTypes.filter((type) => type !== "PREFERRED_PATH");
  if (scenario === "MISSING_CONSERVATIVE") pathTypes = pathTypes.filter((type) => type !== "CONSERVATIVE_PATH");
  if (scenario === "MISSING_ESCALATION") pathTypes = pathTypes.filter((type) => type !== "ESCALATION_PATH");
  if (scenario === "MISSING_REMEDIATION") pathTypes = pathTypes.filter((type) => type !== "REMEDIATION_PATH");
  const paths = orderAlternativePaths(pathTypes.map((type) => buildPath(recommendation, type, scenario)), scenario);
  const comparison = buildPathComparison(recommendation.recommendation_id, paths, scenario);
  const ordering = Object.freeze(paths.map((path) => path.path_type));
  const ordering_rationale = ordering[0] === "ESCALATION_PATH" ? "Critical risk places escalation first." : ordering[0] === "REMEDIATION_PATH" ? "Replay mismatch places remediation first." : ordering[0] === "CONSERVATIVE_PATH" ? "Incomplete evidence places conservative path first." : "Default deterministic order: preferred, conservative, escalation, remediation.";
  const path_generation_hash = computeAlternativePathGenerationHash({ source_generation, paths, comparison, ordering, ordering_rationale });
  const ledger_record: AlternativePathLedgerRecord = Object.freeze({ path_ledger_id: `PLEDGER-7E3-${hashValue("alternative-path-ledger-id", path_generation_hash).slice(0, 10).toUpperCase()}`, tenant_id: source_generation.tenant_id, mission_id: source_generation.mission_id, recommendation_ids: Object.freeze([recommendation.recommendation_id]), path_ids: Object.freeze(paths.map((path) => path.path_id)), evidence_refs: uniqueSorted(paths.flatMap((path) => path.evidence_refs)), lineage_refs: source_generation.ledger_record.lineage_refs, replay_refs: uniqueSorted(paths.flatMap((path) => path.replay_refs)), truth_ledger_refs: uniqueSorted(paths.flatMap((path) => path.truth_ledger_refs)), comparison_refs: Object.freeze([comparison.comparison_id]), created_timestamp: NOW, path_ledger_hash: path_generation_hash });
  const provisional = { contract_version: CONTRACT_VERSION, tenant_id: source_generation.tenant_id, mission_id: source_generation.mission_id, source_generation, paths, comparison, ledger_record, ordering, ordering_rationale, validation_state: "VALID" as const, replay_state: "REPRODUCED" as const, certification_state: "PASS" as const, path_generation_hash };
  const validation = validateAlternativePathGeneration(provisional);
  const replay = replayAlternativePathGeneration(provisional);
  const certification_state = validation.validation_state === "VALID" && replay.replay_state === "REPRODUCED" ? "PASS" : "FAIL";
  return Object.freeze({ ...provisional, validation_state: validation.validation_state, replay_state: replay.replay_state, certification_state });
}

export function computeAlternativePathGenerationHash(input: Pick<AlternativePathGenerationResult, "source_generation" | "paths" | "comparison" | "ordering" | "ordering_rationale">): string {
  return hashValue("alternative-path-generation", { source_hash: input.source_generation.generation_hash, paths: input.paths.map((path) => ({ id: path.path_id, hash: path.path_hash, type: path.path_type, priority: path.path_priority, confidence: path.path_confidence_score })), comparison_hash: input.comparison.comparison_hash, ordering: input.ordering, ordering_rationale: input.ordering_rationale });
}

function recomputeComparisonHash(comparison: AlternativePathComparison): string {
  return hashValue("alternative-path-comparison", { recommendation_id: comparison.recommendation_id, matrix: comparison.matrix });
}

export function validateAlternativePathGeneration(result: Partial<AlternativePathGenerationResult> | undefined): AlternativePathValidationResult {
  const errors: AlternativePathValidationFailure[] = [];
  if (!result) errors.push(failure("PATH_RESULT_MISSING", "result", "alternative path result missing"));
  const paths = result?.paths ?? [];
  const types = paths.map((path) => path.path_type);
  if (!types.includes("PREFERRED_PATH")) errors.push(failure("PREFERRED_PATH_MISSING", "paths", "preferred path missing"));
  if (!types.includes("CONSERVATIVE_PATH")) errors.push(failure("CONSERVATIVE_PATH_MISSING", "paths", "conservative path missing"));
  const recommendation = result?.source_generation?.recommendations?.[0];
  const required = recommendation ? analyzePathRequirements(recommendation) : [];
  if (required.includes("ESCALATION_PATH") && !types.includes("ESCALATION_PATH")) errors.push(failure("REQUIRED_ESCALATION_PATH_MISSING", "paths", "required escalation path missing"));
  if (required.includes("REMEDIATION_PATH") && !types.includes("REMEDIATION_PATH")) errors.push(failure("REQUIRED_REMEDIATION_PATH_MISSING", "paths", "required remediation path missing"));
  for (const path of paths) {
    if (!path.evidence_refs.length) errors.push(failure("PATH_EVIDENCE_MISSING", `paths.${path.path_id}.evidence_refs`, "path evidence missing"));
    if (!path.path_rationale) errors.push(failure("PATH_RISK_RATIONALE_MISSING", `paths.${path.path_id}.path_rationale`, "path risk rationale missing"));
    if (scoreConfidence(path.path_type, recommendation ?? path as never, "BASELINE").band !== path.path_confidence && path.path_confidence !== "LOW") errors.push(failure("PATH_CONFIDENCE_MISMATCH", `paths.${path.path_id}.path_confidence`, "path confidence mismatch"));
    if (!path.path_priority) errors.push(failure("PATH_PRIORITY_MISMATCH", `paths.${path.path_id}.path_priority`, "path priority missing"));
    if (path.execution_authority !== false || path.advisory_only !== true) errors.push(failure("EXECUTION_AUTHORITY_DETECTED", `paths.${path.path_id}.execution_authority`, "execution authority detected"));
    if (!path.replay_refs.length) errors.push(failure("PATH_REPLAY_MISMATCH", `paths.${path.path_id}.replay_refs`, "path replay references missing"));
    if (!path.truth_ledger_refs.length) errors.push(failure("PATH_LEDGER_RECORD_MISSING", `paths.${path.path_id}.truth_ledger_refs`, "path Truth Ledger references missing"));
    if (computePathHash(path) !== path.path_hash) errors.push(failure("PATH_HASH_MISMATCH", `paths.${path.path_id}.path_hash`, "path hash mismatch"));
  }
  const expectedOrder = expectedOrdering(paths);
  if (result?.ordering && canonicalizeConfidenceToString(expectedOrder) !== canonicalizeConfidenceToString(result.ordering)) errors.push(failure("PATH_ORDERING_MISMATCH", "ordering", "path ordering mismatch"));
  if (result?.comparison && recomputeComparisonHash(result.comparison) !== result.comparison.comparison_hash) errors.push(failure("PATH_COMPARISON_MISMATCH", "comparison", "comparison mismatch"));
  if (!result?.ledger_record?.path_ledger_id || !result.ledger_record.truth_ledger_refs.length) errors.push(failure("PATH_LEDGER_RECORD_MISSING", "ledger_record", "path ledger record missing"));
  if (containsTenantLeak(result, result?.tenant_id)) errors.push(failure("TENANT_SCOPE_VIOLATION", "tenant_id", "cross-tenant alternative path detected"));
  if (isRecord(result) && ("hidden_state" in result || "hidden_path_state" in result || "random_seed" in result)) errors.push(failure("HIDDEN_PATH_STATE_DETECTED", "result", "hidden path state detected"));
  if (result?.path_generation_hash && result.source_generation && result.comparison && result.ordering && result.ordering_rationale && computeAlternativePathGenerationHash(result as AlternativePathGenerationResult) !== result.path_generation_hash) errors.push(failure("PATH_HASH_MISMATCH", "path_generation_hash", "path generation hash mismatch"));
  const validation_state = errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["HIDDEN_PATH_STATE_DETECTED", "EXECUTION_AUTHORITY_DETECTED", "ADVISORY_ONLY_BOUNDARY_MISSING"].includes(error.reason)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => ["PATH_REPLAY_MISMATCH", "PATH_ORDERING_MISMATCH", "PATH_COMPARISON_MISMATCH", "PATH_HASH_MISMATCH"].includes(error.reason)) ? "REPLAY_MISMATCH" : errors.some((error) => error.reason === "PATH_EVIDENCE_MISSING") ? "UNKNOWN" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    validation_state,
    validator_version: "ALTERNATIVE-PATH-VALIDATOR-V1",
    checks: Object.freeze({
      preferred_path_generated: !errors.some((error) => error.reason === "PREFERRED_PATH_MISSING"),
      conservative_path_generated: !errors.some((error) => error.reason === "CONSERVATIVE_PATH_MISSING"),
      escalation_path_generated_when_required: !errors.some((error) => error.reason === "REQUIRED_ESCALATION_PATH_MISSING"),
      remediation_path_generated_when_required: !errors.some((error) => error.reason === "REQUIRED_REMEDIATION_PATH_MISSING"),
      evidence_bound: !errors.some((error) => error.reason === "PATH_EVIDENCE_MISSING"),
      risk_rationale_present: !errors.some((error) => error.reason === "PATH_RISK_RATIONALE_MISSING"),
      confidence_reproducible: !errors.some((error) => error.reason === "PATH_CONFIDENCE_MISMATCH"),
      priority_reproducible: !errors.some((error) => error.reason === "PATH_PRIORITY_MISMATCH"),
      ordering_deterministic: !errors.some((error) => error.reason === "PATH_ORDERING_MISMATCH"),
      comparison_reproducible: !errors.some((error) => error.reason === "PATH_COMPARISON_MISMATCH"),
      advisory_only_enforced: !errors.some((error) => ["EXECUTION_AUTHORITY_DETECTED", "ADVISORY_ONLY_BOUNDARY_MISSING"].includes(error.reason)),
      tenant_isolated: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"),
      ledger_recorded: !errors.some((error) => error.reason === "PATH_LEDGER_RECORD_MISSING"),
      replay_ready: !errors.some((error) => error.reason === "PATH_REPLAY_MISMATCH"),
      hidden_state_absent: !errors.some((error) => error.reason === "HIDDEN_PATH_STATE_DETECTED"),
      hash_valid: !errors.some((error) => error.reason === "PATH_HASH_MISMATCH"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function replayAlternativePathGeneration(result: AlternativePathGenerationResult): AlternativePathReplayResult {
  const reconstructed_hash = computeAlternativePathGenerationHash(result);
  const validation = validateAlternativePathGeneration(result);
  const reproduced = validation.validation_state === "VALID" && reconstructed_hash === result.path_generation_hash;
  return Object.freeze({ replay_id: hashValue("alternative-path-replay", { expected: result.path_generation_hash, reconstructed_hash }), replay_state: reproduced ? "REPRODUCED" : result.ledger_record ? "MISMATCH" : "INCOMPLETE", reconstructed_hash, expected_hash: result.path_generation_hash, reconstructed_ordering: expectedOrdering(result.paths), expected_ordering: result.ordering, failure_reason: reproduced ? null : validation.errors[0]?.reason ?? "PATH_HASH_MISMATCH" });
}

export function buildAlternativePathObservabilitySurface(result = generateAlternativeGovernancePaths()): AlternativePathObservabilitySurface {
  const validation = validateAlternativePathGeneration(result);
  const evidence_by_path = Object.fromEntries(PATH_TYPES.map((type) => [type, result.paths.find((path) => path.path_type === type)?.evidence_refs ?? []])) as Record<AlternativePathType, readonly string[]>;
  const risk_by_path = Object.fromEntries(PATH_TYPES.map((type) => [type, result.paths.find((path) => path.path_type === type)?.residual_risk ?? "not generated"])) as Record<AlternativePathType, string>;
  const confidence_by_path = Object.fromEntries(PATH_TYPES.map((type) => [type, result.paths.find((path) => path.path_type === type)?.path_confidence ?? "LOW"])) as Record<AlternativePathType, PathConfidenceBand>;
  return Object.freeze({ path_count: result.paths.length, path_types: Object.freeze(result.paths.map((path) => path.path_type)), preferred_path: result.paths.find((path) => path.path_type === "PREFERRED_PATH")?.path_id ?? null, ordering_rationale: result.ordering_rationale, path_summaries: Object.freeze(result.paths.map((path) => path.path_summary)), evidence_by_path: Object.freeze(evidence_by_path), risk_by_path: Object.freeze(risk_by_path), confidence_by_path: Object.freeze(confidence_by_path), comparison: result.comparison, replay_state: result.replay_state, advisory_only_notice: "Alternative paths are advisory only and may not execute, approve, deploy, mutate policies, change controls, modify certification state, grant authority, or suppress operator review.", validation_failures: Object.freeze(validation.errors.map((error) => error.reason)) });
}

export function buildAlternativePathContract() {
  const baseline_paths = generateAlternativeGovernancePaths();
  return Object.freeze({ doctrine: buildAlternativePathDoctrine(), baseline_paths, observability: buildAlternativePathObservabilitySurface(baseline_paths) });
}
