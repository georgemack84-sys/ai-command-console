import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { buildDecisionPackage } from "@/services/decision-package-builder";
import type { DecisionPackageBuilderResult } from "@/types/decision-package-builder";
import type {
  AssumptionSummary,
  ExplanationValidationResult,
  MissionAlignmentRecord,
  RecommendationExplanation,
  RecommendationExplanationLedgerEntry,
  RecommendationExplanationState,
  RecommendationRationaleFailureReason,
  RecommendationRationaleFoundation,
  RecommendationRationaleGeneratorInput,
  RecommendationRationaleGeneratorResult,
  RecommendationRationaleObservability,
  RecommendationRationaleReplay,
} from "@/types/recommendation-rationale-generator";

const GENERATOR_VERSION = "recommendation-rationale-generator/v1" as const;
const AUTHORIZED_COMPONENT = "recommendation-rationale-generator";
const NOW = "2026-07-04T00:58:00.000Z";

export const RECOMMENDATION_EXPLANATION_STATES: readonly RecommendationExplanationState[] = Object.freeze([
  "INITIALIZED",
  "GENERATING",
  "VALIDATING",
  "COMPLETE",
  "VERIFIED",
  "FAILED",
  "FAIL_CLOSED",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  delete copy.ledger_integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalize(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze([...new Set((values ?? []).filter((value) => value.length > 0))].sort());
}

function explanationHash(explanation: Omit<RecommendationExplanation, "integrity_hash"> | RecommendationExplanation): string {
  return hashWithoutIntegrity(explanation);
}

export function computeRecommendationExplanationHash(explanation: Omit<RecommendationExplanation, "integrity_hash"> | RecommendationExplanation): string {
  return explanationHash(explanation);
}

function alignmentHash(alignment: Omit<MissionAlignmentRecord, "integrity_hash"> | MissionAlignmentRecord): string {
  return hashWithoutIntegrity(alignment);
}

function assumptionsHash(assumptions: Omit<AssumptionSummary, "integrity_hash"> | AssumptionSummary): string {
  return hashWithoutIntegrity(assumptions);
}

function validationHash(validation: Omit<ExplanationValidationResult, "integrity_hash"> | ExplanationValidationResult): string {
  return hashWithoutIntegrity(validation);
}

function ledgerHash(entry: Omit<RecommendationExplanationLedgerEntry, "ledger_integrity_hash"> | RecommendationExplanationLedgerEntry): string {
  return hashWithoutIntegrity(entry);
}

export function createMissionAlignmentRecord(packageBuild: DecisionPackageBuilderResult = buildDecisionPackage()): MissionAlignmentRecord {
  const pkg = packageBuild.package;
  const mission_objectives = Object.freeze([
    `preserve_mission:${pkg.mission_id}`,
    "maintain_governance_visibility",
    "preserve_advisory_only_review",
    "support_replayable_operator_decision",
  ]);
  const supported_objectives = Object.freeze([
    mission_objectives[0]!,
    "maintain_governance_visibility",
    "support_replayable_operator_decision",
  ]);
  const base: Omit<MissionAlignmentRecord, "integrity_hash"> = {
    alignment_id: `mission_alignment_${pkg.package_id}`,
    mission_id: pkg.mission_id,
    mission_objectives,
    supported_objectives,
    alignment_score: Number((supported_objectives.length / mission_objectives.length).toFixed(4)),
    alignment_summary: `Recommendation ${pkg.recommended_option.option_id} supports ${supported_objectives.join(", ")}.`,
  };
  return Object.freeze({ ...base, integrity_hash: alignmentHash(base) });
}

export function createAssumptionSummary(packageBuild: DecisionPackageBuilderResult = buildDecisionPackage()): AssumptionSummary {
  const pkg = packageBuild.package;
  const assumptions = normalize([
    `tenant:${pkg.tenant_id}`,
    `mission:${pkg.mission_id}`,
    `governance_summary:${pkg.governance_summary}`,
    `constitutional_summary:${pkg.constitutional_summary}`,
    `authority_summary:${pkg.authority_summary}`,
    "operator_review_required_before_action",
  ]);
  const base: Omit<AssumptionSummary, "integrity_hash"> = {
    assumption_id: `assumption_summary_${pkg.package_id}`,
    package_id: pkg.package_id,
    assumptions,
    validation_status: assumptions.length > 0 ? "VALIDATED" : "MISSING",
    confidence_level: packageBuild.builder_status === "PASS" ? "HIGH" : "LOW",
  };
  return Object.freeze({ ...base, integrity_hash: assumptionsHash(base) });
}

export function generateRecommendationExplanation(
  packageBuild: DecisionPackageBuilderResult = buildDecisionPackage(),
  alignment: MissionAlignmentRecord = createMissionAlignmentRecord(packageBuild),
  assumptions: AssumptionSummary = createAssumptionSummary(packageBuild),
): RecommendationExplanation {
  const pkg = packageBuild.package;
  const base: Omit<RecommendationExplanation, "integrity_hash"> = {
    explanation_id: `recommendation_explanation_${pkg.package_id}`,
    package_id: pkg.package_id,
    orchestration_id: pkg.orchestration_id,
    recommendation_id: pkg.recommended_option.option_id,
    mission_id: pkg.mission_id,
    tenant_id: pkg.tenant_id,
    recommendation_summary: `Mission Control recommends: ${pkg.recommended_option.label}. ${pkg.recommended_option.summary}`,
    rationale: `${pkg.rationale} Evidence basis: ${pkg.evidence_summary}`,
    mission_alignment: alignment.alignment_summary,
    objective_justification: `Supported objectives: ${alignment.supported_objectives.join(", ")}. Alignment score: ${alignment.alignment_score}.`,
    expected_benefit: `Expected benefit: ${pkg.risk_summary}; confidence context: ${pkg.confidence_summary}.`,
    assumptions: assumptions.assumptions,
    projected_outcome: `Projected outcome: ${pkg.forecast_summary}`,
    replay_ref: pkg.replay_ref,
    lineage_ref: pkg.lineage_ref,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: explanationHash(base) });
}

function explanationFailures(input: {
  packageBuild: DecisionPackageBuilderResult;
  explanation: RecommendationExplanation;
  alignment: MissionAlignmentRecord;
  assumptions: AssumptionSummary;
  authorized: boolean;
}): readonly RecommendationRationaleFailureReason[] {
  const failures: RecommendationRationaleFailureReason[] = [];
  const explanation = input.explanation;
  if (!input.authorized) failures.push("UNAUTHORIZED_RATIONALE_GENERATOR_ACCESS");
  if (input.packageBuild.builder_status !== "PASS") failures.push("PACKAGE_BUILD_INVALID");
  if (!explanation.recommendation_summary || !explanation.recommendation_id) failures.push("RECOMMENDATION_MISSING");
  if (!explanation.rationale) failures.push("RATIONALE_MISSING");
  if (!explanation.mission_alignment || input.alignment.supported_objectives.length === 0) failures.push("MISSION_ALIGNMENT_UNAVAILABLE");
  if (!explanation.objective_justification || input.alignment.mission_objectives.length === 0) failures.push("OBJECTIVE_REFERENCES_MISSING");
  if (!explanation.expected_benefit) failures.push("EXPECTED_BENEFIT_ABSENT");
  if (explanation.assumptions.length === 0 || input.assumptions.validation_status !== "VALIDATED") failures.push("ASSUMPTIONS_UNAVAILABLE");
  if (!explanation.projected_outcome) failures.push("PROJECTED_OUTCOME_MISSING");
  if (!explanation.replay_ref) failures.push("REPLAY_REFERENCE_MISSING");
  if (!explanation.lineage_ref) failures.push("LINEAGE_REFERENCE_MISSING");
  if (explanation.tenant_id !== input.packageBuild.package.tenant_id) failures.push("TENANT_MISMATCH");
  if (!explanation.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (explanationHash(explanation) !== explanation.integrity_hash || alignmentHash(input.alignment) !== input.alignment.integrity_hash || assumptionsHash(input.assumptions) !== input.assumptions.integrity_hash) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as RecommendationRationaleFailureReason[]);
}

function buildValidation(explanation: RecommendationExplanation, failures: readonly RecommendationRationaleFailureReason[]): ExplanationValidationResult {
  const has = (failure: RecommendationRationaleFailureReason) => failures.includes(failure);
  const base: Omit<ExplanationValidationResult, "integrity_hash"> = {
    validation_id: `explanation_validation_${explanation.explanation_id}`,
    explanation_id: explanation.explanation_id,
    recommendation_present: !has("RECOMMENDATION_MISSING"),
    rationale_present: !has("RATIONALE_MISSING"),
    mission_alignment_present: !has("MISSION_ALIGNMENT_UNAVAILABLE"),
    objective_justification_present: !has("OBJECTIVE_REFERENCES_MISSING"),
    expected_benefit_present: !has("EXPECTED_BENEFIT_ABSENT"),
    assumptions_present: !has("ASSUMPTIONS_UNAVAILABLE"),
    outcome_present: !has("PROJECTED_OUTCOME_MISSING"),
    replay_present: !has("REPLAY_REFERENCE_MISSING"),
    lineage_present: !has("LINEAGE_REFERENCE_MISSING"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function writeLedger(explanation: RecommendationExplanation, validation: ExplanationValidationResult): readonly RecommendationExplanationLedgerEntry[] {
  const base: Omit<RecommendationExplanationLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `recommendation_explanation_ledger_${explanation.explanation_id}`,
    explanation_id: explanation.explanation_id,
    package_id: explanation.package_id,
    recommendation_id: explanation.recommendation_id,
    generation_timestamp: NOW,
    replay_ref: explanation.replay_ref,
    lineage_ref: explanation.lineage_ref,
    integrity_hash: explanation.integrity_hash,
    validation_status: validation.validation_status,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<RecommendationRationaleGeneratorResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    package_build_result: result.package_build_result,
    explanation: result.explanation,
    mission_alignment: result.mission_alignment,
    assumptions: result.assumptions,
    validation: result.validation,
    explanation_ledger: result.explanation_ledger,
    failures: result.failures,
  });
}

export function generateRecommendationRationale(input: RecommendationRationaleGeneratorInput = {}): RecommendationRationaleGeneratorResult {
  const package_build_result = input.package_build_result ?? buildDecisionPackage();
  const mission_alignment = input.mission_alignment ?? createMissionAlignmentRecord(package_build_result);
  const assumptions = input.assumptions ?? createAssumptionSummary(package_build_result);
  const explanation = input.explanation ?? generateRecommendationExplanation(package_build_result, mission_alignment, assumptions);
  const initialFailures = explanationFailures({
    packageBuild: package_build_result,
    explanation,
    alignment: mission_alignment,
    assumptions,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = buildValidation(explanation, initialFailures);
  const ledger = writeLedger(explanation, validation);
  const ledgerFailures: readonly RecommendationRationaleFailureReason[] = ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted) ? [] : ["INTEGRITY_VERIFICATION_FAILED"];
  const finalFailures = Object.freeze([...new Set([...initialFailures, ...ledgerFailures])] as RecommendationRationaleFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : buildValidation(explanation, finalFailures);
  const finalLedger = finalValidation === validation ? ledger : writeLedger(explanation, finalValidation);
  const base: Omit<RecommendationRationaleGeneratorResult, "integrity_hash" | "replay_hash"> = {
    generator_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.failures.length > 0,
    package_build_result,
    explanation,
    mission_alignment,
    assumptions,
    validation: finalValidation,
    explanation_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly RecommendationRationaleFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = buildValidation(explanation, replayFailures);
    const replayBase: Omit<RecommendationRationaleGeneratorResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      generator_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      explanation_ledger: Object.freeze([]),
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayRecommendationRationale(result: RecommendationRationaleGeneratorResult): RecommendationRationaleReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && explanationHash(result.explanation) === result.explanation.integrity_hash
    && alignmentHash(result.mission_alignment) === result.mission_alignment.integrity_hash
    && assumptionsHash(result.assumptions) === result.assumptions.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && result.explanation_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: RecommendationRationaleFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<RecommendationRationaleReplay, "integrity_hash"> = {
    replay_id: "replay_recommendation_rationale_generator",
    replay_valid,
    explanation_id: result.explanation.explanation_id,
    package_id: result.explanation.package_id,
    recommendation_id: result.explanation.recommendation_id,
    recommendation_summary: result.explanation.recommendation_summary,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildRecommendationRationaleObservability(result: RecommendationRationaleGeneratorResult): RecommendationRationaleObservability {
  return Object.freeze({
    explanations_generated: result.generator_status === "PASS" ? 1 : 0,
    rationale_completeness: result.validation.rationale_present ? 1 : 0,
    mission_alignment_coverage: result.validation.mission_alignment_present ? result.mission_alignment.alignment_score : 0,
    objective_reference_coverage: result.validation.objective_justification_present ? 1 : 0,
    assumption_completeness: result.validation.assumptions_present ? 1 : 0,
    explanation_generation_latency_ms: 0,
    validation_failures: result.failures.length,
    replay_reproducibility: replayRecommendationRationale(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getRecommendationRationaleFoundation(): RecommendationRationaleFoundation {
  const result = generateRecommendationRationale();
  const replay = replayRecommendationRationale(result);
  return Object.freeze({
    generator_version: GENERATOR_VERSION,
    explanation_states: RECOMMENDATION_EXPLANATION_STATES,
    result,
    replay,
    observability: buildRecommendationRationaleObservability(result),
  });
}

export const RecommendationRationaleGenerator = Object.freeze({
  generate: generateRecommendationRationale,
  replay: replayRecommendationRationale,
});
