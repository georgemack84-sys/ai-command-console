import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  BoundaryCategory,
  BoundaryContext,
  BoundaryDecision,
  BoundaryDecisionType,
  BoundaryEnforcementContract,
  BoundaryEnforcementFailureReason,
  BoundaryEnforcementFramework,
  BoundaryEnforcementLifecycleState,
  BoundaryEnforcementObservabilitySurface,
  BoundaryEnforcementScenario,
  BoundaryEnforcementValidationReport,
  BoundaryExecutionConstraints,
  BoundaryLineage,
  BoundaryReplayResult,
  BoundaryRequestType,
  BoundaryRestrictionType,
  BoundaryRuntimeMetadata,
  BoundaryTruthLedgerEntry,
  BoundaryValidationResult,
} from "@/types/boundary-enforcement-contract";

const NOW = "2026-06-30T02:00:00.000Z";
const CONTRACT_VERSION = "boundary-enforcement-contract/v8F.1" as const;
const PIPELINE = Object.freeze(["Contract Created", "Authority Validation", "Governance Validation", "Policy Validation", "Constitution Validation", "Execution Validation", "Tenant Isolation Validation", "Decision Recording", "Truth Ledger Commit", "Replay Binding"]);
const CATEGORIES = Object.freeze(["AUTHORITY", "GOVERNANCE", "POLICY", "CONSTITUTIONAL", "EXECUTION", "TENANT"] as const);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function scenarioFailure(scenario: BoundaryEnforcementScenario): BoundaryEnforcementFailureReason | null {
  const map: Partial<Record<BoundaryEnforcementScenario, BoundaryEnforcementFailureReason>> = {
    AUTHORITY_INSUFFICIENT: "AUTHORITY_INSUFFICIENT",
    GOVERNANCE_REJECTION: "GOVERNANCE_REJECTED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    POLICY_VIOLATION: "POLICY_VIOLATION",
    EXECUTION_LIMIT_EXCEEDED: "EXECUTION_LIMIT_EXCEEDED",
    TENANT_MISMATCH: "TENANT_MISMATCH",
    HIDDEN_EXECUTION: "HIDDEN_EXECUTION_DETECTED",
    REPLAY_INTEGRITY_FAILURE: "REPLAY_INTEGRITY_FAILURE",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILURE",
    UNKNOWN_CONDITION: "UNKNOWN_CONDITION_FAIL_CLOSED",
    MISSING_TRUTH_LEDGER: "TRUTH_LEDGER_REFERENCE_MISSING",
    LINEAGE_MISSING: "LINEAGE_REFERENCE_MISSING",
    HASH_MISMATCH: "INTEGRITY_VERIFICATION_FAILURE",
    SIGNATURE_MISMATCH: "DIGITAL_SIGNATURE_INVALID",
  };
  return map[scenario] ?? null;
}

function categoryForFailure(failure: BoundaryEnforcementFailureReason | null): BoundaryCategory | null {
  if (!failure) return null;
  if (failure === "AUTHORITY_INSUFFICIENT") return "AUTHORITY";
  if (failure === "GOVERNANCE_REJECTED") return "GOVERNANCE";
  if (failure === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTIONAL";
  if (failure === "POLICY_VIOLATION") return "POLICY";
  if (failure === "EXECUTION_LIMIT_EXCEEDED" || failure === "HIDDEN_EXECUTION_DETECTED") return "EXECUTION";
  if (failure === "TENANT_MISMATCH") return "TENANT";
  return "AUTHORITY";
}

function context(category: BoundaryCategory, scenario: BoundaryEnforcementScenario): BoundaryContext {
  const failure = scenarioFailure(scenario);
  const failedCategory = categoryForFailure(failure);
  const approved = failedCategory !== category;
  return Object.freeze({
    context_id: id("BECX", "boundary-context-id", { category, scenario }),
    approved,
    authority_ref: approved ? `${category.toLowerCase()}:approved:v8f1` : "",
    evaluated_rules: freezeArray([`${category.toLowerCase()}:explicit-authorization`, `${category.toLowerCase()}:default-deny`, `${category.toLowerCase()}:replay-required`]),
    evidence_refs: freezeArray(approved ? [`evidence:${category.toLowerCase()}:v8f1`] : []),
    lineage_reference: scenario === "LINEAGE_MISSING" ? "" : `lineage:${category.toLowerCase()}:v8f1`,
  });
}

function constraints(scenario: BoundaryEnforcementScenario): BoundaryExecutionConstraints {
  return Object.freeze({
    maximum_duration: scenario === "ALLOW_WITH_RESTRICTIONS" ? 300 : 900,
    maximum_depth: 4,
    maximum_recursion: scenario === "ALLOW_WITH_RESTRICTIONS" ? 1 : 2,
    maximum_parallelism: scenario === "ALLOW_WITH_RESTRICTIONS" ? 2 : 4,
    allowed_resources: freezeArray(["runtime-observation", "truth-ledger", "governance-replay"]),
    prohibited_resources: freezeArray(["governance-mutation", "constitution-mutation", "cross-tenant-memory"]),
    retry_limit: 2,
    timeout: scenario === "EXECUTION_LIMIT_EXCEEDED" ? 0 : 120,
    rollback_required: true,
  });
}

function validationHashSource(validation: Omit<BoundaryValidationResult, "integrity_hash"> | BoundaryValidationResult) {
  return {
    validation_id: validation.validation_id,
    validator: validation.validator,
    category: validation.category,
    result: validation.result,
    confidence: validation.confidence,
    evidence: validation.evidence,
    evaluated_rules: validation.evaluated_rules,
    detected_violations: validation.detected_violations,
    explanation: validation.explanation,
    timestamp: validation.timestamp,
    replay_reference: validation.replay_reference,
  };
}

export function computeBoundaryValidationHash(validation: Omit<BoundaryValidationResult, "integrity_hash"> | BoundaryValidationResult): string {
  return hashValue("boundary-enforcement-validation", validationHashSource(validation));
}

function buildValidation(category: BoundaryCategory, scenario: BoundaryEnforcementScenario): BoundaryValidationResult {
  const failure = scenarioFailure(scenario);
  const failedCategory = categoryForFailure(failure);
  const detected = failedCategory === category && failure ? [failure] : [];
  const source = {
    validation_id: id("BEV", "boundary-validation-id", { category, scenario }),
    validator: `boundary-${category.toLowerCase()}-validator`,
    category,
    result: detected.length ? "INVALID" as const : "VALID" as const,
    confidence: detected.length ? 0.31 : 0.98,
    evidence: freezeArray(detected.length ? [] : [`evidence:${category.toLowerCase()}:v8f1`]),
    evaluated_rules: freezeArray([`${category.toLowerCase()}:must-pass`, "default-deny", "operator-governance-constitution-supremacy"]),
    detected_violations: freezeArray(detected),
    explanation: detected.length ? `${category} boundary rejected the request.` : `${category} boundary validated deterministically.`,
    timestamp: NOW,
    replay_reference: scenario === "REPLAY_INTEGRITY_FAILURE" ? "" : `replay:${category.toLowerCase()}:v8f1`,
  };
  return Object.freeze({ ...source, integrity_hash: computeBoundaryValidationHash(source) });
}

function decisionHashSource(decision: Omit<BoundaryDecision, "integrity_hash"> | BoundaryDecision) {
  return {
    decision_id: decision.decision_id,
    decision: decision.decision,
    allowed: decision.allowed,
    restrictions: decision.restrictions,
    restriction_reason: decision.restriction_reason,
    rejection_reason: decision.rejection_reason,
    escalation_reason: decision.escalation_reason,
    operator_required: decision.operator_required,
    governance_required: decision.governance_required,
    confidence: decision.confidence,
    timestamp: decision.timestamp,
  };
}

export function computeBoundaryDecisionHash(decision: Omit<BoundaryDecision, "integrity_hash"> | BoundaryDecision): string {
  return hashValue("boundary-enforcement-decision", decisionHashSource(decision));
}

function buildDecision(scenario: BoundaryEnforcementScenario, validations: readonly BoundaryValidationResult[]): BoundaryDecision {
  const failures = unique(validations.flatMap((item) => item.detected_violations));
  const escalation = scenario === "OPERATOR_ESCALATION_REQUIRED";
  const restricted = scenario === "ALLOW_WITH_RESTRICTIONS";
  const decision: BoundaryDecisionType = failures.length ? (scenario === "UNKNOWN_CONDITION" ? "FAIL_SAFE" : "BLOCK") : escalation ? "ESCALATE" : restricted ? "ALLOW_WITH_RESTRICTIONS" : "ALLOW";
  const restrictions: readonly BoundaryRestrictionType[] = restricted ? freezeArray(["EXECUTION_SCOPE_REDUCED", "RECURSION_LIMITED", "SUPERVISION_REQUIRED", "OPERATOR_APPROVAL_REQUIRED"] as const) : freezeArray([]);
  const source = {
    decision_id: id("BED", "boundary-decision-id", { scenario, failures }),
    decision,
    allowed: decision === "ALLOW" || decision === "ALLOW_WITH_RESTRICTIONS",
    restrictions,
    restriction_reason: restricted ? "Action is permitted only under reduced execution scope, recursion limits, and supervision." : null,
    rejection_reason: failures[0] ?? null,
    escalation_reason: escalation ? "Operator approval required before boundary authorization can proceed." : null,
    operator_required: escalation || restricted || failures.length > 0,
    governance_required: true,
    confidence: failures.length ? 0.24 : restricted ? 0.82 : escalation ? 0.74 : 0.99,
    timestamp: NOW,
  };
  return Object.freeze({ ...source, integrity_hash: computeBoundaryDecisionHash(source) });
}

function metadata(): BoundaryRuntimeMetadata {
  return Object.freeze({
    runtime_version: "mission-control-runtime/v8f",
    contract_version: CONTRACT_VERSION,
    governance_version: "governance-intelligence/v7m",
    policy_version: "policy-intelligence/v7b",
    constitution_version: "mission-control-constitution/v1",
    execution_environment: "controlled-autonomy-runtime",
    tenant_version: "tenant-boundary/v8f",
  });
}

function lineage(scenario: BoundaryEnforcementScenario): BoundaryLineage {
  const missing = scenario === "LINEAGE_MISSING";
  return Object.freeze({
    originating_request: "request:controlled-autonomy:execute-approved-workflow",
    parent_workflow: "workflow:mission-control",
    parent_plan: "plan:controlled-autonomy",
    delegated_parent: "delegation:mission-control",
    supervising_authority: "runtime-supervision-certification-gate/v8E.E",
    governance_decision: "governance:approved",
    constitutional_validation: "constitution:operator-supremacy",
    execution_lineage: missing ? "" : "lineage:execution:boundary-enforcement:v8f1",
  });
}

function contractHashSource(contract: Omit<BoundaryEnforcementContract, "integrity_hash" | "digital_signature" | "replay"> | Omit<BoundaryEnforcementContract, "integrity_hash" | "digital_signature"> | BoundaryEnforcementContract) {
  return {
    boundary_enforcement_id: contract.boundary_enforcement_id,
    immutable_uuid: contract.immutable_uuid,
    contract_version: contract.contract_version,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    execution_id: contract.execution_id,
    workflow_id: contract.workflow_id,
    request_type: contract.request_type,
    request_origin: contract.request_origin,
    boundary_category: contract.boundary_category,
    requested_action: contract.requested_action,
    requested_scope: contract.requested_scope,
    execution_constraints: contract.execution_constraints,
    validation_hashes: contract.validation_results.map((item) => item.integrity_hash),
    decision_hash: contract.decision.integrity_hash,
    runtime_state: contract.runtime_state,
    runtime_metadata: contract.runtime_metadata,
    lineage: contract.lineage,
    created_at: contract.created_at,
    validated_at: contract.validated_at,
    completed_at: contract.completed_at,
    lineage_reference: contract.lineage_reference,
    replay_reference: contract.replay_reference,
    truth_ledger_reference: contract.truth_ledger_reference,
  };
}

export function computeBoundaryContractIntegrityHash(contract: Omit<BoundaryEnforcementContract, "integrity_hash" | "digital_signature" | "replay"> | Omit<BoundaryEnforcementContract, "integrity_hash" | "digital_signature"> | BoundaryEnforcementContract): string {
  return hashValue("boundary-enforcement-contract", contractHashSource(contract));
}

export function computeBoundaryDigitalSignature(integrityHash: string): string {
  return hashValue("boundary-enforcement-digital-signature", { signer: "mission-control-boundary-enforcement", integrityHash });
}

function buildLedger(base: Omit<BoundaryEnforcementContract, "truth_ledger_entry" | "replay" | "integrity_hash" | "digital_signature">, scenario: BoundaryEnforcementScenario): BoundaryTruthLedgerEntry {
  const source = {
    ledger_entry_id: id("BEL", "boundary-ledger-id", base.boundary_enforcement_id),
    boundary_enforcement_id: base.boundary_enforcement_id,
    enforcement_event: `boundary-enforcement:${base.decision.decision.toLowerCase()}`,
    validation_evidence: unique(base.validation_results.flatMap((item) => item.evidence)),
    authority_evidence: freezeArray(base.authority_context.evidence_refs),
    policy_evidence: freezeArray(base.policy_context.evidence_refs),
    governance_evidence: freezeArray(base.governance_context.evidence_refs),
    constitutional_evidence: freezeArray(base.constitutional_context.evidence_refs),
    execution_constraints_hash: hashValue("boundary-execution-constraints", base.execution_constraints),
    decision_outcome: base.decision.decision,
    replay_references: unique(base.validation_results.map((item) => item.replay_reference)),
    append_only: true as const,
    recorded_at: NOW,
  };
  return Object.freeze({ ...source, ledger_hash: scenario === "MISSING_TRUTH_LEDGER" ? "" : hashValue("boundary-truth-ledger-entry", source) });
}

function replayContract(base: Omit<BoundaryEnforcementContract, "replay" | "integrity_hash" | "digital_signature">, scenario: BoundaryEnforcementScenario): BoundaryReplayResult {
  const source = {
    replay_id: id("BER", "boundary-replay-id", base.boundary_enforcement_id),
    boundary_enforcement_id: base.boundary_enforcement_id,
    reconstructed_pipeline: freezeArray(PIPELINE),
    reconstructed_decision: base.decision.decision,
    reconstructed_validation_hashes: freezeArray(base.validation_results.map((item) => item.integrity_hash)),
    reconstructed_contract_hash: scenario === "REPLAY_INTEGRITY_FAILURE" ? "mismatched-boundary-replay" : computeBoundaryContractIntegrityHash(base),
    validation_state: scenario === "REPLAY_INTEGRITY_FAILURE" ? "FAIL" as const : "PASS" as const,
    failure_reason: scenario === "REPLAY_INTEGRITY_FAILURE" ? "REPLAY_INTEGRITY_FAILURE" as const : null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("boundary-replay", source) });
}

export function buildBoundaryEnforcementContract(input: { scenario?: BoundaryEnforcementScenario; request_type?: BoundaryRequestType } = {}): BoundaryEnforcementContract {
  const scenario = input.scenario ?? "BASELINE";
  const request_type = input.request_type ?? "EXECUTE";
  const validations = freezeArray(CATEGORIES.map((category) => buildValidation(category, scenario)));
  const decision = buildDecision(scenario, validations);
  const lifecycle: BoundaryEnforcementLifecycleState = decision.decision === "BLOCK" || decision.decision === "FAIL_SAFE" ? "BLOCKED" : decision.decision === "ESCALATE" ? "ESCALATED" : decision.decision === "ALLOW_WITH_RESTRICTIONS" ? "RESTRICTED" : "AUTHORIZED";
  const boundary_enforcement_id = id("BEC", "boundary-enforcement-id", { scenario, request_type });
  const base = {
    boundary_enforcement_id,
    immutable_uuid: id("BEU", "boundary-enforcement-uuid", boundary_enforcement_id),
    contract_version: CONTRACT_VERSION,
    tenant_id: scenario === "TENANT_MISMATCH" ? "tenant_beta" : "tenant_alpha",
    mission_id: "mission_controlled_autonomy",
    execution_id: "exec_controlled_autonomy",
    workflow_id: "workflow_boundary_enforcement",
    request_type,
    request_origin: "controlled-autonomy-runtime",
    boundary_category: categoryForFailure(scenarioFailure(scenario)) ?? "AUTHORITY",
    authority_context: context("AUTHORITY", scenario),
    governance_context: context("GOVERNANCE", scenario),
    policy_context: context("POLICY", scenario),
    constitutional_context: context("CONSTITUTIONAL", scenario),
    requested_action: request_type.toLowerCase(),
    requested_scope: freezeArray(["mission", "workflow", "execution"]),
    execution_constraints: constraints(scenario),
    validation_results: validations,
    decision,
    confidence: decision.confidence,
    operator_required: decision.operator_required,
    restriction_reason: decision.restriction_reason,
    rejection_reason: decision.rejection_reason,
    escalation_reason: decision.escalation_reason,
    runtime_state: lifecycle,
    runtime_metadata: metadata(),
    lineage: lineage(scenario),
    created_at: NOW,
    validated_at: NOW,
    completed_at: NOW,
    lineage_reference: scenario === "LINEAGE_MISSING" ? "" : "lineage:boundary-enforcement:v8f1",
    replay_reference: scenario === "REPLAY_INTEGRITY_FAILURE" ? "" : "replay:boundary-enforcement:v8f1",
    truth_ledger_reference: scenario === "MISSING_TRUTH_LEDGER" ? "" : `truth-ledger:boundary-enforcement:${boundary_enforcement_id}`,
  };
  const truth_ledger_entry = buildLedger(base, scenario);
  const withLedger = { ...base, truth_ledger_entry };
  const replay = replayContract(withLedger, scenario);
  const withReplay = { ...withLedger, replay };
  const integrity_hash = scenario === "HASH_MISMATCH" ? "tampered-boundary-contract" : computeBoundaryContractIntegrityHash(withReplay);
  const digital_signature = scenario === "SIGNATURE_MISMATCH" ? "tampered-boundary-signature" : computeBoundaryDigitalSignature(integrity_hash);
  return Object.freeze({ ...withReplay, integrity_hash, digital_signature });
}

export function validateBoundaryEnforcementContract(contract = buildBoundaryEnforcementContract()): BoundaryEnforcementValidationReport {
  const failures: BoundaryEnforcementFailureReason[] = [];
  const validationFailures = contract.validation_results.flatMap((item) => item.detected_violations);
  failures.push(...validationFailures);
  if (!contract.boundary_enforcement_id || !contract.immutable_uuid) failures.push("INTEGRITY_VERIFICATION_FAILURE");
  if (!contract.authority_context.approved) failures.push("AUTHORITY_INSUFFICIENT");
  if (!contract.governance_context.approved) failures.push("GOVERNANCE_REJECTED");
  if (!contract.policy_context.approved) failures.push("POLICY_VIOLATION");
  if (!contract.constitutional_context.approved) failures.push("CONSTITUTIONAL_VIOLATION");
  if (contract.execution_constraints.timeout <= 0) failures.push("EXECUTION_LIMIT_EXCEEDED");
  if (contract.tenant_id !== "tenant_alpha") failures.push("TENANT_MISMATCH");
  if (!contract.replay_reference || contract.replay.validation_state === "FAIL") failures.push("REPLAY_INTEGRITY_FAILURE");
  if (!contract.lineage_reference || !contract.lineage.execution_lineage) failures.push("LINEAGE_REFERENCE_MISSING");
  if (!contract.truth_ledger_reference || !contract.truth_ledger_entry.ledger_hash) failures.push("TRUTH_LEDGER_REFERENCE_MISSING");
  if (computeBoundaryContractIntegrityHash(contract) !== contract.integrity_hash) failures.push("INTEGRITY_VERIFICATION_FAILURE");
  if (computeBoundaryDigitalSignature(contract.integrity_hash) !== contract.digital_signature) failures.push("DIGITAL_SIGNATURE_INVALID");
  if (contract.decision.decision === "ALLOW" && failures.length) failures.push("UNKNOWN_CONDITION_FAIL_CLOSED");
  if (contract.decision.decision === "FAIL_SAFE") failures.push("UNKNOWN_CONDITION_FAIL_CLOSED");
  const uniqueFailures = unique(failures);
  const validation_state = uniqueFailures.length ? "FAIL" as const : "PASS" as const;
  const source = { boundary_enforcement_id: contract.boundary_enforcement_id, validation_state, failures: uniqueFailures };
  return Object.freeze({
    validation_id: id("BEVR", "boundary-validation-report-id", source),
    boundary_enforcement_id: contract.boundary_enforcement_id,
    validation_state,
    failures: uniqueFailures,
    identity_immutable: Boolean(contract.boundary_enforcement_id && contract.immutable_uuid),
    authority_validated: !uniqueFailures.includes("AUTHORITY_INSUFFICIENT"),
    governance_validated: !uniqueFailures.includes("GOVERNANCE_REJECTED"),
    policy_validated: !uniqueFailures.includes("POLICY_VIOLATION"),
    constitution_validated: !uniqueFailures.includes("CONSTITUTIONAL_VIOLATION"),
    execution_validated: !uniqueFailures.includes("EXECUTION_LIMIT_EXCEEDED") && !uniqueFailures.includes("HIDDEN_EXECUTION_DETECTED"),
    tenant_isolated: !uniqueFailures.includes("TENANT_MISMATCH"),
    default_deny_enforced: contract.decision.decision !== "ALLOW" || uniqueFailures.length === 0,
    replay_ready: !uniqueFailures.includes("REPLAY_INTEGRITY_FAILURE"),
    lineage_complete: !uniqueFailures.includes("LINEAGE_REFERENCE_MISSING"),
    truth_ledger_recorded: !uniqueFailures.includes("TRUTH_LEDGER_REFERENCE_MISSING"),
    signature_valid: !uniqueFailures.includes("DIGITAL_SIGNATURE_INVALID"),
    integrity_verified: !uniqueFailures.includes("INTEGRITY_VERIFICATION_FAILURE"),
    validation_hash: hashValue("boundary-validation-report", source),
  });
}

export function replayBoundaryEnforcementContract(contract = buildBoundaryEnforcementContract()): BoundaryReplayResult {
  return contract.replay;
}

export function buildBoundaryEnforcementObservabilitySurface(contract = buildBoundaryEnforcementContract()): BoundaryEnforcementObservabilitySurface {
  const validation = validateBoundaryEnforcementContract(contract);
  return Object.freeze({
    boundary_enforcement_id: contract.boundary_enforcement_id,
    lifecycle_state: contract.runtime_state,
    validation_progress: freezeArray(contract.validation_results.map((item) => item.category)),
    evaluated_boundaries: freezeArray(CATEGORIES),
    active_restrictions: contract.decision.restrictions,
    detected_violations: validation.failures,
    confidence_score: contract.confidence,
    operator_required: contract.operator_required,
    governance_required: contract.decision.governance_required,
    replay_status: contract.replay.validation_state,
    lineage_reference: contract.lineage_reference,
    execution_timeline: freezeArray(PIPELINE),
    integrity_status: validation.integrity_verified && validation.signature_valid ? "VALID" : "INVALID",
  });
}

export function getBoundaryEnforcementFramework(): BoundaryEnforcementFramework {
  const contract = buildBoundaryEnforcementContract();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["explicit-authorization", "default-deny", "governance-supremacy", "constitutional-supremacy", "operator-supremacy", "fail-closed", "deterministic-validation", "immutable-evidence", "tenant-isolation", "replay-fidelity"]),
      contract_version: CONTRACT_VERSION,
      lifecycle_states: freezeArray(["CREATED", "VALIDATING", "AUTHORITY_VALIDATED", "GOVERNANCE_VALIDATED", "POLICY_VALIDATED", "CONSTITUTION_VALIDATED", "EXECUTION_VALIDATED", "ISOLATION_VALIDATED", "AUTHORIZED", "RESTRICTED", "BLOCKED", "EXECUTED", "ESCALATED", "COMPLETED"] as const),
      request_types: freezeArray(["PLAN", "ORCHESTRATE", "DELEGATE", "SUPERVISE", "EXECUTE", "ROLLBACK", "PAUSE", "RESUME", "TERMINATE", "ESCALATE"] as const),
      boundary_categories: freezeArray(["AUTHORITY", "GOVERNANCE", "CONSTITUTIONAL", "POLICY", "EXECUTION", "TENANT"] as const),
      decision_types: freezeArray(["ALLOW", "ALLOW_WITH_RESTRICTIONS", "BLOCK", "ESCALATE", "FAIL_SAFE"] as const),
      validation_states: freezeArray(["CREATED", "VALIDATING", "VALID", "INVALID", "RESTRICTED", "BLOCKED", "ESCALATED", "COMPLETED"] as const),
    }),
    contract,
    validation: validateBoundaryEnforcementContract(contract),
    replay: replayBoundaryEnforcementContract(contract),
    observability: buildBoundaryEnforcementObservabilitySurface(contract),
  });
}
