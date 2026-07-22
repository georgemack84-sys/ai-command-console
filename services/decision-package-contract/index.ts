import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { certifyGovernanceConstitutionalDecision } from "@/services/governance-constitutional-decision-certification-gate";
import type { GovernanceDecisionCertificationGateResult } from "@/types/governance-constitutional-decision-certification-gate";
import type {
  DecisionPackageContractFailureReason,
  DecisionPackageContractFoundation,
  DecisionPackageContractInput,
  DecisionPackageContractObservability,
  DecisionPackageContractReplay,
  DecisionPackageContractResult,
  DecisionPackageLifecycleState,
  DecisionPackageSchemaRegistryEntry,
  OperatorDecisionPackage,
  PackageLifecycleStateRecord,
  PackageMetadata,
  PackageOption,
  PackageValidationResult,
} from "@/types/decision-package-contract";

const CONTRACT_VERSION = "decision-package-contract/v1" as const;
const AUTHORIZED_COMPONENT = "decision-package-contract";
const NOW = "2026-07-04T00:50:00.000Z";

export const DECISION_PACKAGE_LIFECYCLE_STATES: readonly DecisionPackageLifecycleState[] = Object.freeze([
  "DRAFT",
  "BUILDING",
  "VALIDATING",
  "VERIFIED",
  "CERTIFIED",
  "READY_FOR_PRESENTATION",
  "PRESENTED",
  "SUPERSEDED",
  "ARCHIVED",
]);

export const DECISION_PACKAGE_ALLOWED_TRANSITIONS: Readonly<Record<DecisionPackageLifecycleState, readonly DecisionPackageLifecycleState[]>> = Object.freeze({
  DRAFT: Object.freeze(["BUILDING"] as DecisionPackageLifecycleState[]),
  BUILDING: Object.freeze(["VALIDATING"] as DecisionPackageLifecycleState[]),
  VALIDATING: Object.freeze(["VERIFIED"] as DecisionPackageLifecycleState[]),
  VERIFIED: Object.freeze(["CERTIFIED"] as DecisionPackageLifecycleState[]),
  CERTIFIED: Object.freeze(["READY_FOR_PRESENTATION"] as DecisionPackageLifecycleState[]),
  READY_FOR_PRESENTATION: Object.freeze(["PRESENTED"] as DecisionPackageLifecycleState[]),
  PRESENTED: Object.freeze(["SUPERSEDED", "ARCHIVED"] as DecisionPackageLifecycleState[]),
  SUPERSEDED: Object.freeze(["ARCHIVED"] as DecisionPackageLifecycleState[]),
  ARCHIVED: Object.freeze([] as DecisionPackageLifecycleState[]),
});

const REQUIRED_FIELDS: readonly string[] = Object.freeze([
  "package_id",
  "package_version",
  "orchestration_id",
  "mission_id",
  "tenant_id",
  "generated_timestamp",
  "generated_by",
  "recommended_option",
  "alternative_options",
  "rejected_options",
  "rationale",
  "evidence_summary",
  "risk_summary",
  "confidence_summary",
  "forecast_summary",
  "governance_summary",
  "constitutional_summary",
  "authority_summary",
  "operator_required_action",
  "approval_requirements",
  "rollback_guidance",
  "recovery_guidance",
  "replay_ref",
  "lineage_ref",
  "integrity_hash",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalize(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze([...new Set((values ?? []).filter((value) => value.length > 0))].sort());
}

function optionHash(option: Omit<PackageOption, "integrity_hash"> | PackageOption): string {
  return hashWithoutIntegrity(option);
}

function option(input: Omit<PackageOption, "integrity_hash">): PackageOption {
  return Object.freeze({ ...input, integrity_hash: optionHash(input) });
}

function metadataHash(metadata: Omit<PackageMetadata, "integrity_hash"> | PackageMetadata): string {
  return hashWithoutIntegrity(metadata);
}

function lifecycleHash(lifecycle: Omit<PackageLifecycleStateRecord, "integrity_hash"> | PackageLifecycleStateRecord): string {
  return hashWithoutIntegrity(lifecycle);
}

function packageHash(pkg: Omit<OperatorDecisionPackage, "integrity_hash"> | OperatorDecisionPackage): string {
  return hashWithoutIntegrity(pkg);
}

export function computeOperatorDecisionPackageHash(pkg: Omit<OperatorDecisionPackage, "integrity_hash"> | OperatorDecisionPackage): string {
  return packageHash(pkg);
}

function schemaRegistryHash(entry: Omit<DecisionPackageSchemaRegistryEntry, "integrity_hash"> | DecisionPackageSchemaRegistryEntry): string {
  return hashWithoutIntegrity(entry);
}

export function createDecisionPackageSchemaRegistry(): DecisionPackageSchemaRegistryEntry {
  const base: Omit<DecisionPackageSchemaRegistryEntry, "integrity_hash"> = {
    schema_version: "operator-decision-package-schema/v1",
    package_version: "operator-decision-package/v1",
    generator_version: "decision-package-contract/v1",
    required_fields: REQUIRED_FIELDS,
    lifecycle_states: DECISION_PACKAGE_LIFECYCLE_STATES,
    backward_compatible: true,
    destructive_changes_allowed: false,
  };
  return Object.freeze({ ...base, integrity_hash: schemaRegistryHash(base) });
}

function createMetadata(certification: GovernanceDecisionCertificationGateResult, package_id: string): PackageMetadata {
  const ledger = certification.ledger_result.ledger_record;
  const base: Omit<PackageMetadata, "integrity_hash"> = {
    package_id,
    package_version: "operator-decision-package/v1",
    schema_version: "operator-decision-package-schema/v1",
    generated_timestamp: NOW,
    generator_version: "decision-package-contract/v1",
    orchestration_id: ledger.governance_decision_id,
    replay_ref: `replay_package_${ledger.governance_decision_id}`,
    lineage_ref: ledger.lineage_refs[0] ?? `lineage_package_${ledger.governance_decision_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: metadataHash(base) });
}

export function createPackageLifecycleState(
  package_id = "operator_decision_package_default",
  current_state: DecisionPackageLifecycleState = "READY_FOR_PRESENTATION",
  previous_state: DecisionPackageLifecycleState = "CERTIFIED",
): PackageLifecycleStateRecord {
  const base: Omit<PackageLifecycleStateRecord, "integrity_hash"> = {
    package_id,
    current_state,
    previous_state,
    transition_timestamp: NOW,
    transition_reason: `Package transitioned from ${previous_state} to ${current_state}.`,
    transitioned_by: AUTHORIZED_COMPONENT,
  };
  return Object.freeze({ ...base, integrity_hash: lifecycleHash(base) });
}

export function createOperatorDecisionPackage(certification: GovernanceDecisionCertificationGateResult = certifyGovernanceConstitutionalDecision()): OperatorDecisionPackage {
  const ledger = certification.ledger_result.ledger_record;
  const package_id = `operator_decision_package_${ledger.governance_decision_id}`;
  const metadata = createMetadata(certification, package_id);
  const lifecycle = createPackageLifecycleState(package_id);
  const evidenceRefs = ledger.evidence_refs;
  const replayRef = metadata.replay_ref;
  const lineageRef = metadata.lineage_ref;
  const recommended_option = option({
    option_id: `recommended_${ledger.governance_decision_id}`,
    label: "Proceed with certified governance review",
    summary: `Present decision ${ledger.governance_decision_id} with enforcement outcome ${ledger.enforcement_outcome}.`,
    governance_notes: certification.final_report.passed_tests.map((test) => `certified:${test}`),
    evidence_refs: evidenceRefs,
    replay_ref: replayRef,
  });
  const alternative_options = Object.freeze([
    option({
      option_id: `alternative_request_more_evidence_${ledger.governance_decision_id}`,
      label: "Request more evidence",
      summary: "Operator may request additional evidence before accepting the advisory package.",
      governance_notes: ["advisory_only", "no_execution"],
      evidence_refs: evidenceRefs,
      replay_ref: replayRef,
    }),
  ]);
  const rejected_options = Object.freeze([
    option({
      option_id: `rejected_bypass_governance_${ledger.governance_decision_id}`,
      label: "Bypass governance controls",
      summary: "Rejected because governance and constitutional controls cannot be bypassed.",
      governance_notes: ["governance_bypass_rejected", "constitutional_controls_preserved"],
      evidence_refs: evidenceRefs,
      replay_ref: replayRef,
    }),
  ]);
  const base: Omit<OperatorDecisionPackage, "integrity_hash"> = {
    package_id,
    package_version: "operator-decision-package/v1",
    orchestration_id: ledger.governance_decision_id,
    mission_id: ledger.mission_id,
    tenant_id: ledger.tenant_id,
    generated_timestamp: NOW,
    generated_by: AUTHORIZED_COMPONENT,
    recommended_option,
    alternative_options,
    rejected_options,
    rationale: `Package is based on Phase 9.7 certification state ${certification.gate_status}.`,
    evidence_summary: `Evidence refs: ${evidenceRefs.join(",")}.`,
    risk_summary: `Enforcement outcome: ${ledger.enforcement_outcome}; fail closed: ${certification.fail_closed}.`,
    confidence_summary: `Certification tests passed: ${certification.final_report.passed_tests.length}/${certification.final_report.executed_test_suite.length}.`,
    forecast_summary: "Forecast remains advisory and replay-bound; no action is executed by this package.",
    governance_summary: certification.final_report.governance_summary,
    constitutional_summary: certification.final_report.constitutional_summary,
    authority_summary: ledger.authority_results.join(";"),
    operator_required_action: ledger.enforcement_outcome === "ALLOW_WITH_GOVERNANCE_REVIEW" ? "APPROVE_REVIEW" : "REVIEW_ONLY",
    approval_requirements: certification.ledger_result.operator_approvals.map((approval) => approval.approval_scope),
    rollback_guidance: "Rollback requires superseding this advisory package with a new immutable package version.",
    recovery_guidance: "Recovery requires replaying the package and governance ledger before presenting a replacement.",
    replay_ref: replayRef,
    lineage_ref: lineageRef,
    metadata,
    lifecycle,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

function lifecycleValid(lifecycle: PackageLifecycleStateRecord): boolean {
  if (!lifecycle.previous_state) return lifecycle.current_state === "DRAFT";
  return DECISION_PACKAGE_ALLOWED_TRANSITIONS[lifecycle.previous_state].includes(lifecycle.current_state);
}

function packageFailures(input: {
  pkg: OperatorDecisionPackage;
  certification: GovernanceDecisionCertificationGateResult;
  registry: DecisionPackageSchemaRegistryEntry;
  authorized: boolean;
}): readonly DecisionPackageContractFailureReason[] {
  const failures: DecisionPackageContractFailureReason[] = [];
  const pkg = input.pkg;
  if (!input.authorized) failures.push("UNAUTHORIZED_PACKAGE_CONTRACT_ACCESS");
  if (!pkg.package_id) failures.push("PACKAGE_ID_MISSING");
  if (pkg.package_version !== "operator-decision-package/v1" || pkg.metadata.schema_version !== "operator-decision-package-schema/v1" || pkg.metadata.generator_version !== "decision-package-contract/v1") failures.push("VERSION_INVALID");
  if (schemaRegistryHash(input.registry) !== input.registry.integrity_hash) failures.push("SCHEMA_INVALID");
  if (REQUIRED_FIELDS.some((field) => !(field in pkg) || (pkg as unknown as Record<string, unknown>)[field] === "")) failures.push("REQUIRED_FIELD_MISSING");
  if (!lifecycleValid(pkg.lifecycle) || lifecycleHash(pkg.lifecycle) !== pkg.lifecycle.integrity_hash) failures.push("LIFECYCLE_INVALID");
  if (!pkg.governance_summary) failures.push("GOVERNANCE_SUMMARY_MISSING");
  if (!pkg.constitutional_summary) failures.push("CONSTITUTIONAL_SUMMARY_MISSING");
  if (!pkg.authority_summary) failures.push("AUTHORITY_INFORMATION_MISSING");
  if (!pkg.replay_ref || !pkg.metadata.replay_ref) failures.push("REPLAY_REFERENCE_MISSING");
  if (!pkg.lineage_ref || !pkg.metadata.lineage_ref) failures.push("LINEAGE_REFERENCE_MISSING");
  if (!pkg.integrity_hash || !pkg.metadata.integrity_hash || !pkg.recommended_option.integrity_hash) failures.push("INTEGRITY_HASH_MISSING");
  if (pkg.tenant_id !== input.certification.ledger_result.ledger_record.tenant_id) failures.push("TENANT_MISMATCH");
  if (!pkg.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (metadataHash(pkg.metadata) !== pkg.metadata.integrity_hash) failures.push("METADATA_INVALID");
  if (optionHash(pkg.recommended_option) !== pkg.recommended_option.integrity_hash || pkg.alternative_options.some((item) => optionHash(item) !== item.integrity_hash) || pkg.rejected_options.some((item) => optionHash(item) !== item.integrity_hash)) failures.push("INTEGRITY_HASH_MISSING");
  if (packageHash(pkg) !== pkg.integrity_hash) failures.push("INTEGRITY_HASH_MISSING");
  return Object.freeze([...new Set(failures)] as DecisionPackageContractFailureReason[]);
}

function validationHash(validation: Omit<PackageValidationResult, "integrity_hash"> | PackageValidationResult): string {
  return hashWithoutIntegrity(validation);
}

function buildValidation(pkg: OperatorDecisionPackage, failures: readonly DecisionPackageContractFailureReason[]): PackageValidationResult {
  const has = (failure: DecisionPackageContractFailureReason) => failures.includes(failure);
  const base: Omit<PackageValidationResult, "integrity_hash"> = {
    validation_id: `package_contract_validation_${pkg.package_id}`,
    package_id: pkg.package_id,
    schema_valid: !has("SCHEMA_INVALID") && !has("REQUIRED_FIELD_MISSING") && !has("PACKAGE_ID_MISSING"),
    lifecycle_valid: !has("LIFECYCLE_INVALID"),
    integrity_valid: !has("INTEGRITY_HASH_MISSING") && !has("METADATA_INVALID"),
    replay_valid: !has("REPLAY_REFERENCE_MISSING") && !has("REPLAY_DIVERGENCE"),
    governance_valid: !has("GOVERNANCE_SUMMARY_MISSING"),
    constitutional_valid: !has("CONSTITUTIONAL_SUMMARY_MISSING"),
    authority_valid: !has("AUTHORITY_INFORMATION_MISSING"),
    tenant_valid: !has("TENANT_MISMATCH"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    fail_closed: failures.length > 0,
    failures,
    validation_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function resultReplayHash(result: Omit<DecisionPackageContractResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    certification_result: result.certification_result,
    package: result.package,
    schema_registry: result.schema_registry,
    validation: result.validation,
    failures: result.failures,
  });
}

export function validateDecisionPackageContract(input: DecisionPackageContractInput = {}): DecisionPackageContractResult {
  const certification_result = input.certification_result ?? certifyGovernanceConstitutionalDecision();
  const schema_registry = createDecisionPackageSchemaRegistry();
  const packageRecord = input.package ?? createOperatorDecisionPackage(certification_result);
  const pkg = input.lifecycle ? Object.freeze({ ...packageRecord, lifecycle: input.lifecycle, integrity_hash: packageHash({ ...packageRecord, lifecycle: input.lifecycle }) }) : packageRecord;
  const failures = packageFailures({
    pkg,
    certification: certification_result,
    registry: schema_registry,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = buildValidation(pkg, failures);
  const base: Omit<DecisionPackageContractResult, "integrity_hash" | "replay_hash"> = {
    contract_status: validation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: validation.fail_closed,
    certification_result,
    package: pkg,
    schema_registry,
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly DecisionPackageContractFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = buildValidation(pkg, replayFailures);
    const replayBase: Omit<DecisionPackageContractResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      contract_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayDecisionPackageContract(result: DecisionPackageContractResult): DecisionPackageContractReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && packageHash(result.package) === result.package.integrity_hash
    && metadataHash(result.package.metadata) === result.package.metadata.integrity_hash
    && lifecycleHash(result.package.lifecycle) === result.package.lifecycle.integrity_hash
    && schemaRegistryHash(result.schema_registry) === result.schema_registry.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash;
  const failures: DecisionPackageContractFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<DecisionPackageContractReplay, "integrity_hash"> = {
    replay_id: "replay_decision_package_contract",
    replay_valid,
    package_id: result.package.package_id,
    package_version: result.package.package_version,
    schema_version: result.package.metadata.schema_version,
    lifecycle_state: result.package.lifecycle.current_state,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildDecisionPackageContractObservability(result: DecisionPackageContractResult): DecisionPackageContractObservability {
  return Object.freeze({
    packages_validated: 1,
    validation_failures: result.failures.length,
    schema_violations: result.failures.filter((failure) => failure === "SCHEMA_INVALID" || failure === "REQUIRED_FIELD_MISSING").length,
    lifecycle_violations: result.failures.filter((failure) => failure === "LIFECYCLE_INVALID").length,
    replay_completeness: result.validation.replay_valid ? 1 : 0,
    integrity_failures: result.failures.filter((failure) => failure === "INTEGRITY_HASH_MISSING" || failure === "METADATA_INVALID").length,
    version_distribution: Object.freeze({ "operator-decision-package/v1": 1 }),
    lineage_completeness: result.validation.replay_valid && !result.failures.includes("LINEAGE_REFERENCE_MISSING") ? 1 : 0,
    package_generation_latency_ms: 0,
  });
}

export function getDecisionPackageContractFoundation(): DecisionPackageContractFoundation {
  const result = validateDecisionPackageContract();
  const replay = replayDecisionPackageContract(result);
  return Object.freeze({
    contract_version: CONTRACT_VERSION,
    lifecycle_states: DECISION_PACKAGE_LIFECYCLE_STATES,
    allowed_transitions: DECISION_PACKAGE_ALLOWED_TRANSITIONS,
    schema_registry: result.schema_registry,
    result,
    replay,
    observability: buildDecisionPackageContractObservability(result),
  });
}

export const DecisionPackageContract = Object.freeze({
  create: createOperatorDecisionPackage,
  validate: validateDecisionPackageContract,
  replay: replayDecisionPackageContract,
});
