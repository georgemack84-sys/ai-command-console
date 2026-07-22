import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPlanningReasoning, validatePlanningReasoning } from "@/services/caf-planning-reasoning";
import type {
  CollaborationCertificationOutcome,
  CollaborationEvidenceEntry,
  CollaborationFederationBundle,
  CollaborationFederationFailure,
  CollaborationFederationInput,
  CollaborationFederationResult,
  CollaborationFederationScenario,
  CollaborationFederationValidation,
} from "@/types/caf-collaboration-federation";

const VERSION = "caf-collaboration-federation/v3.6" as const;
const IDENTIFIER = "CafCollaborationFederation" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function scenarioFailure(scenario: CollaborationFederationScenario): CollaborationFederationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly CollaborationFederationFailure[], failure: CollaborationFederationFailure): boolean { return failures.includes(failure); }
function outcome(failures: readonly CollaborationFederationFailure[]): CollaborationCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "FAIL";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function buildEvidence(failures: readonly CollaborationFederationFailure[]): readonly CollaborationEvidenceEntry[] {
  const gap = has(failures, "AUDIT_GAP");
  const events: readonly CollaborationEvidenceEntry["event_type"][] = freezeArray(["PARTICIPANT_REGISTERED", "AUTHORITY_DECISION", "MESSAGE_RECORDED", "NEGOTIATION_EVENT", "DELEGATION_CHAIN", "FEDERATION_EVENT", "POLICY_EVALUATION", "REPLAY_VALIDATED", "CERTIFICATION_REFERENCED"]);
  return freezeArray(events.filter((event) => !(gap && event === "MESSAGE_RECORDED")).map((event_type, index) => nested({
    evidence_id: `P3.6-EVIDENCE-${String(index + 1).padStart(3, "0")}`,
    event_type,
    evidence_refs: gap && event_type === "FEDERATION_EVENT" ? freezeArray([]) : freezeArray([`evidence:p3.6:${event_type.toLowerCase()}`]),
    lineage_ref: gap && event_type === "DELEGATION_CHAIN" ? "" : `lineage:p3.6:${event_type.toLowerCase()}`,
    sequence: index + 1,
    immutable: true,
    replayable: true,
  })));
}

function resultReplayHash(result: Omit<CollaborationFederationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    collaboration: result.collaboration.integrity_hash,
    delegation: result.delegation.integrity_hash,
    negotiation: result.negotiation.integrity_hash,
    federation: result.federation.integrity_hash,
    interoperability: result.interoperability.integrity_hash,
    shared_context: result.shared_context.integrity_hash,
    governance: result.governance.integrity_hash,
    trust_security: result.trust_security.integrity_hash,
    evidence: result.evidence.map((entry) => entry.integrity_hash),
    replay_validation: result.replay_validation.integrity_hash,
    observability: result.observability.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<CollaborationFederationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runCollaborationFederation(input: CollaborationFederationInput = {}): CollaborationFederationResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<CollaborationFederationFailure>(direct ? [direct] : []);
  const p35 = runPlanningReasoning();
  const p35Valid = validatePlanningReasoning(p35).valid && !has(scenarioFailures, "P3_5_PLANNING_REASONING_INVALID");
  const failures = freezeArray<CollaborationFederationFailure>(p35Valid ? scenarioFailures : [...scenarioFailures, "P3_5_PLANNING_REASONING_INVALID"]);
  const tenant_id = has(failures, "TENANT_ISOLATION_VIOLATION") ? "tenant:cross-boundary" : input.tenant_id ?? "tenant:caf-primary";

  const collaboration = nested({
    collaboration_id: "P3.6-COLLABORATION-001",
    model_ref: "model:p3.6:governed-collaboration",
    participant_refs: freezeArray(["agent:p3.6:source", "agent:p3.6:target"]),
    shared_objective_refs: freezeArray([p35.objective.objective_id]),
    responsibility_refs: freezeArray(["responsibility:p3.6:planner", "responsibility:p3.6:reviewer"]),
    lifecycle_states: has(failures, "COLLABORATION_MODEL_INCOMPLETE") ? freezeArray(["CREATED", "ACTIVE"]) : freezeArray(["CREATED", "NEGOTIATING", "ACTIVE", "COMPLETED", "CANCELLED", "ARCHIVED"]),
    contracts_deterministic: !has(failures, "COLLABORATION_MODEL_INCOMPLETE"),
    shared_state_governed: !has(failures, "SHARED_STATE_UNGOVERNED"),
    collaboration_deterministic: !has(failures, "COLLABORATION_MODEL_INCOMPLETE"),
    registry_ref: "registry:p3.6:collaboration",
  });
  const delegation = nested({
    delegation_id: "P3.6-DELEGATION-001",
    source_agent_ref: "agent:p3.6:source",
    target_agent_ref: "agent:p3.6:target",
    task_ref: "task:p3.6:review-recommendation",
    lifecycle_state: has(failures, "UNAUTHORIZED_DELEGATION") ? "REVOKED" as const : "COMPLETED" as const,
    authority_preserved: !has(failures, "DELEGATION_AUTHORITY_LOST") && !has(failures, "UNAUTHORIZED_DELEGATION"),
    ownership_transfer_governed: !has(failures, "UNAUTHORIZED_DELEGATION"),
    acceptance_validated: !has(failures, "UNAUTHORIZED_DELEGATION"),
    completion_evidenced: !has(failures, "AUDIT_GAP"),
    replayable: !has(failures, "REPLAY_INCONSISTENCY"),
    lineage_refs: has(failures, "DELEGATION_AUTHORITY_LOST") ? freezeArray([]) : freezeArray(["lineage:p3.6:delegation"]),
  });
  const negotiation = nested({
    negotiation_id: "P3.6-NEGOTIATION-001",
    proposal_refs: freezeArray(["proposal:p3.6:initial"]),
    counter_proposal_refs: freezeArray(["proposal:p3.6:counter"]),
    outcome: "AGREEMENT" as const,
    conflict_resolution_ref: "resolution:p3.6:deterministic",
    history_refs: freezeArray(["history:p3.6:proposal", "history:p3.6:counter", "history:p3.6:agreement"]),
    deterministic: !has(failures, "NON_DETERMINISTIC_NEGOTIATION"),
    governance_enforced: !has(failures, "COLLABORATION_GOVERNANCE_BYPASS"),
  });
  const federation = nested({
    federation_id: "P3.6-FEDERATION-001",
    federation_registry_ref: "registry:p3.6:federation",
    external_partner_refs: freezeArray(["partner:p3.6:cci-nexus"]),
    federation_contract_refs: freezeArray(["contract:p3.6:federation-session"]),
    session_refs: freezeArray(["session:p3.6:federation-001"]),
    trust_established: !has(failures, "FEDERATION_TRUST_FAILURE"),
    session_secure: !has(failures, "FEDERATION_SESSION_UNSECURED"),
    remote_coordination_governed: !has(failures, "COLLABORATION_GOVERNANCE_BYPASS"),
    deterministic: true,
  });
  const interoperability = nested({
    interoperability_id: "P3.6-INTEROPERABILITY-001",
    supported_domains: freezeArray(["CAF instances", "CCI services", "external platforms", "partner ecosystems"]),
    protocol_adapter_refs: freezeArray(["adapter:p3.6:cci-nexus"]),
    capability_mapping_refs: freezeArray(["mapping:p3.6:capability"]),
    schema_translation_refs: has(failures, "INTEROPERABILITY_CONTRACT_VIOLATION") ? freezeArray([]) : freezeArray(["schema:p3.6:collaboration"]),
    endpoint_discovery_validated: true,
    mappings_deterministic: true,
    contracts_validated: !has(failures, "INTEROPERABILITY_CONTRACT_VIOLATION"),
  });
  const shared_context = nested({
    context_id: "P3.6-SHARED-CONTEXT-001",
    shared_memory_refs: freezeArray(["P3.4-MEMORY-SEMANTIC-001"]),
    context_version: "1.0.0",
    participant_visibility_refs: has(failures, "CONTEXT_VISIBILITY_BYPASS") ? freezeArray([]) : freezeArray(["visibility:p3.6:source", "visibility:p3.6:target"]),
    synchronization_hash: hash(["P3.6-SHARED-CONTEXT-001", tenant_id]),
    visibility_governed: !has(failures, "CONTEXT_VISIBILITY_BYPASS"),
    synchronization_integrity: !has(failures, "SHARED_STATE_UNGOVERNED"),
    tenant_id,
    tenant_isolated: !has(failures, "TENANT_ISOLATION_VIOLATION"),
  });
  const governance = nested({
    governance_id: "P3.6-COLLABORATION-GOVERNANCE-001",
    authority_validated: !has(failures, "COLLABORATION_GOVERNANCE_BYPASS"),
    participant_authorized: !has(failures, "UNAUTHORIZED_DELEGATION"),
    delegation_approved: !has(failures, "UNAUTHORIZED_DELEGATION"),
    federation_policy_validated: !has(failures, "FEDERATION_TRUST_FAILURE"),
    collaboration_policy_validated: !has(failures, "COLLABORATION_GOVERNANCE_BYPASS"),
    lifecycle_validated: true,
    replay_validated: !has(failures, "REPLAY_INCONSISTENCY"),
    fail_closed_enforced: !has(failures, "COLLABORATION_GOVERNANCE_BYPASS"),
  });
  const trust_security = nested({
    trust_id: "P3.6-TRUST-SECURITY-001",
    federation_trust_validated: !has(failures, "FEDERATION_TRUST_FAILURE"),
    partner_verification_complete: !has(failures, "PARTNER_VALIDATION_INCOMPLETE"),
    credential_validation_complete: !has(failures, "PARTNER_VALIDATION_INCOMPLETE"),
    reputation_assessment_ref: "reputation:p3.6:partner",
    session_security_validated: !has(failures, "FEDERATION_SESSION_UNSECURED"),
    deterministic: true,
  });
  const evidence = buildEvidence(failures);
  const evidenceComplete = evidence.length === 9 && evidence.every((entry) => entry.immutable && entry.replayable && entry.evidence_refs.length > 0 && entry.lineage_ref);
  const observability = nested({
    observability_id: "P3.6-COLLABORATION-OBSERVABILITY-001",
    metrics: Object.freeze({
      active_collaborations: 1,
      active_delegations: delegation.lifecycle_state === "COMPLETED" ? 0 : 1,
      negotiation_events: negotiation.history_refs.length,
      federation_sessions: federation.session_refs.length,
      interoperability_checks: 1,
      policy_violations: failures.length,
      replay_match_rate: has(failures, "REPLAY_INCONSISTENCY") ? 0 : 1,
    }),
    collaboration_dashboard_validated: !has(failures, "OBSERVABILITY_GAP"),
    federation_dashboard_validated: !has(failures, "OBSERVABILITY_GAP"),
    complete_visibility: !has(failures, "OBSERVABILITY_GAP"),
  });
  const replay_validation = nested({
    replay_validation_id: "P3.6-REPLAY-VALIDATION-001",
    collaboration_replayed: collaboration.collaboration_deterministic,
    delegation_replayed: delegation.replayable,
    negotiation_replayed: negotiation.deterministic,
    federation_replayed: federation.deterministic,
    interoperability_replayed: interoperability.mappings_deterministic,
    audit_replayed: evidenceComplete,
    deterministic: !has(failures, "REPLAY_INCONSISTENCY"),
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!p35Valid ? ["P3_5_PLANNING_REASONING_INVALID" as const] : []),
    ...(!collaboration.contracts_deterministic || !collaboration.collaboration_deterministic ? ["COLLABORATION_MODEL_INCOMPLETE" as const] : []),
    ...(!collaboration.shared_state_governed || !shared_context.synchronization_integrity ? ["SHARED_STATE_UNGOVERNED" as const] : []),
    ...(!delegation.acceptance_validated || !delegation.ownership_transfer_governed ? ["UNAUTHORIZED_DELEGATION" as const] : []),
    ...(!delegation.authority_preserved || delegation.lineage_refs.length === 0 ? ["DELEGATION_AUTHORITY_LOST" as const] : []),
    ...(!negotiation.deterministic ? ["NON_DETERMINISTIC_NEGOTIATION" as const] : []),
    ...(!federation.trust_established ? ["FEDERATION_TRUST_FAILURE" as const] : []),
    ...(!federation.session_secure ? ["FEDERATION_SESSION_UNSECURED" as const] : []),
    ...(!interoperability.contracts_validated ? ["INTEROPERABILITY_CONTRACT_VIOLATION" as const] : []),
    ...(!shared_context.visibility_governed ? ["CONTEXT_VISIBILITY_BYPASS" as const] : []),
    ...(!governance.authority_validated || !governance.fail_closed_enforced ? ["COLLABORATION_GOVERNANCE_BYPASS" as const] : []),
    ...(!trust_security.partner_verification_complete || !trust_security.credential_validation_complete ? ["PARTNER_VALIDATION_INCOMPLETE" as const] : []),
    ...(!observability.complete_visibility ? ["OBSERVABILITY_GAP" as const] : []),
    ...(!evidenceComplete ? ["AUDIT_GAP" as const] : []),
    ...(!replay_validation.deterministic ? ["REPLAY_INCONSISTENCY" as const] : []),
    ...(!shared_context.tenant_isolated ? ["TENANT_ISOLATION_VIOLATION" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.6-COLLABORATION-CERTIFICATION-GATE-001",
    outcome: outcome(derivedFailures),
    certified: outcome(derivedFailures) === "PASS",
    collaboration_correctness: collaboration.collaboration_deterministic && collaboration.shared_state_governed,
    delegation_integrity: delegation.authority_preserved && delegation.replayable,
    negotiation_determinism: negotiation.deterministic,
    federation_security: federation.trust_established && federation.session_secure,
    interoperability_compatibility: interoperability.contracts_validated,
    governance_compliance: governance.authority_validated && governance.fail_closed_enforced,
    replay_validated: replay_validation.deterministic,
    audit_complete: evidenceComplete,
    tenant_isolation: shared_context.tenant_isolated,
    constitutional_conformance: p35Valid,
    approved_for_p3_7: outcome(derivedFailures) === "PASS",
    failures: derivedFailures,
  });
  const base: Omit<CollaborationFederationResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    constitutional_ref: "P3.0-CAF-CONSTITUTION-001",
    planning_reasoning_ref: "caf-planning-reasoning/v3.5",
    cci_messaging_ref: "Program 2 - CCI Messaging Infrastructure",
    collaboration,
    delegation,
    negotiation,
    federation,
    interoperability,
    shared_context,
    governance,
    trust_security,
    evidence,
    replay_validation,
    observability,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateCollaborationFederation(result?: CollaborationFederationResult): CollaborationFederationValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, collaboration_valid: false, delegation_valid: false, federation_valid: false, governance_valid: false, evidence_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const collaboration_valid = verifyHashedRecord(result.collaboration) && result.collaboration.collaboration_deterministic && result.collaboration.shared_state_governed;
  const delegation_valid = verifyHashedRecord(result.delegation) && result.delegation.authority_preserved && result.delegation.replayable;
  const federation_valid = verifyHashedRecord(result.federation) && result.federation.trust_established && result.federation.session_secure && result.interoperability.contracts_validated;
  const governance_valid = verifyHashedRecord(result.governance) && result.governance.authority_validated && result.governance.fail_closed_enforced && result.shared_context.tenant_isolated;
  const evidence_valid = result.evidence.length === 9 && result.evidence.every((entry) => verifyHashedRecord(entry) && entry.immutable && entry.replayable && entry.evidence_refs.length > 0 && Boolean(entry.lineage_ref));
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const valid = replay_hash_valid && integrity_hash_valid && collaboration_valid && delegation_valid && federation_valid && governance_valid && evidence_valid && certification_valid && result.replay_validation.deterministic;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, collaboration_valid, delegation_valid, federation_valid, governance_valid, evidence_valid, certification_valid, failures: result.certification.failures });
}

export function replayCollaborationFederation(result = runCollaborationFederation()): boolean {
  const replayed = runCollaborationFederation();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateCollaborationFederation(result).valid;
}

export function getCollaborationFederationBundle(): CollaborationFederationBundle {
  const result = runCollaborationFederation();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      consumes_planning_reasoning: true,
      consumes_cci_messaging_identity_security_runtime_governance_evidence: true,
      owns_collaboration_not_messaging_infrastructure: true,
      governed_delegation_required: true,
      deterministic_negotiation_required: true,
      secure_federation_required: true,
      tenant_isolation_required: true,
    }),
    result,
    validation: validateCollaborationFederation(result),
  });
}

export const CollaborationFederationService = Object.freeze({
  run: runCollaborationFederation,
  validate: validateCollaborationFederation,
  replay: replayCollaborationFederation,
});
