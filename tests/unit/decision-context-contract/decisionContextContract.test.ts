import { describe, expect, it } from "vitest";
import {
  buildDecisionContextObservability,
  computeDecisionContextIntegrityHash,
  createDecisionContext,
  getDecisionContextContractFoundation,
  replayDecisionContext,
  serializeDecisionContext,
  transitionDecisionContextLifecycle,
  validateDecisionContext,
} from "@/services/decision-context-contract";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";

describe("Mission Control Phase 9.3.1 Decision Context Contract", () => {
  it("creates the canonical immutable DecisionContext contract", () => {
    const foundation = getDecisionContextContractFoundation();

    expect(foundation.schema_version).toBe("9.3.1");
    expect(foundation.construction_order).toEqual([
      "mission_context",
      "tenant_context",
      "operator_context",
      "evidence_context",
      "dependency_context",
      "risk_context",
      "confidence_context",
      "governance_context",
      "constitutional_context",
      "runtime_context",
      "recovery_context",
      "forecast_context",
      "historical_context",
      "replay_context",
    ]);
    expect(foundation.context.context_id).toContain(foundation.context.decision_candidate_id);
    expect(foundation.context.identity.context_id).toBe(foundation.context.context_id);
    expect(foundation.context.context_completeness_score).toBe(1);
    expect(foundation.context.operator_context.constitutional_rationale).toContain("Advisory-only");
    expect(foundation.validation.validation_state).toBe("VALID");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("serializes and hashes deterministically for identical inputs", () => {
    const first = createDecisionContext();
    const second = createDecisionContext();

    expect(serializeDecisionContext(first)).toBe(serializeDecisionContext(second));
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(computeDecisionContextIntegrityHash(first)).toBe(first.integrity_hash);
  });

  it("builds context from a normalized decision candidate", () => {
    const normalized = normalizeDecisionCandidateInput();
    const context = createDecisionContext({ candidate: normalized.candidate });

    expect(context.decision_candidate_id).toBe(normalized.candidate?.candidate_id);
    expect(context.evidence_context.supporting_evidence).toEqual(normalized.candidate?.evidence_refs);
    expect(context.governance_context.supporting_evidence).toEqual(normalized.candidate?.governance_refs);
    expect(context.replay_context.replay_reference).toBe(normalized.candidate?.replay_refs[0]);
    expect(validateDecisionContext(context).validation_state).toBe("VALID");
  });

  it("fails closed when required domains or explainability are missing", () => {
    const missingDomain = createDecisionContext({
      missing_context: ["evidence_context"],
      domain_overrides: { evidence_context: { status: "MISSING", supporting_evidence: [] } },
    });
    const missingExplainability = createDecisionContext({
      domain_overrides: { governance_context: { resolver: "" } },
    });

    expect(validateDecisionContext(missingDomain).failures).toContain("MANDATORY_DOMAIN_MISSING");
    expect(validateDecisionContext(missingDomain).checks.completeness_valid).toBe(true);
    expect(missingDomain.context_completeness_score).toBeLessThan(1);
    expect(validateDecisionContext(missingExplainability).failures).toContain("DOMAIN_EXPLAINABILITY_MISSING");
  });

  it("validates identity, schema version, tenant isolation, and integrity", () => {
    const context = createDecisionContext();
    const schemaMismatch = { ...context, schema_version: "9.9.9" };
    const identityMismatch = { ...context, identity: { ...context.identity, decision_candidate_id: "other_candidate" } };
    const tenantLeak = createDecisionContext({
      domain_overrides: { evidence_context: { supporting_evidence: ["evidence_tenant_beta_mission_phase_9_decision_orchestration_001"] } },
    });
    const tampered = { ...context, integrity_hash: "tampered" };

    expect(validateDecisionContext(schemaMismatch).failures).toContain("SCHEMA_VERSION_MISMATCH");
    expect(validateDecisionContext(identityMismatch).failures).toContain("IDENTITY_MISMATCH");
    expect(validateDecisionContext(tenantLeak).failures).toContain("TENANT_ISOLATION_VIOLATION");
    expect(validateDecisionContext(tampered).failures).toContain("INTEGRITY_MISMATCH");
  });

  it("requires governance, constitutional, replay, authority, and advisory context", () => {
    const noGovernance = createDecisionContext({ domain_overrides: { governance_context: { supporting_evidence: [] } } });
    const noConstitution = createDecisionContext({ domain_overrides: { constitutional_context: { constitutional_rationale: "" } } });
    const noReplay = createDecisionContext({ domain_overrides: { replay_context: { replay_reference: "" } } });
    const noAuthority = createDecisionContext({ domain_overrides: { operator_context: { governance_rationale: "" } } });
    const nonAdvisory = createDecisionContext({ domain_overrides: { operator_context: { constitutional_rationale: "Execution authority requested." } } });

    expect(validateDecisionContext(noGovernance).failures).toContain("GOVERNANCE_UNAVAILABLE");
    expect(validateDecisionContext(noConstitution).failures).toContain("CONSTITUTIONAL_UNAVAILABLE");
    expect(validateDecisionContext(noReplay).failures).toContain("REPLAY_UNAVAILABLE");
    expect(validateDecisionContext(noAuthority).failures).toContain("AUTHORITY_UNDEFINED");
    expect(validateDecisionContext(nonAdvisory).failures).toContain("ADVISORY_ONLY_VIOLATION");
  });

  it("enforces deterministic lifecycle transitions", () => {
    const draft = createDecisionContext({ lifecycle_state: "DRAFT" });
    const valid = transitionDecisionContextLifecycle(draft, "UNDER_CONSTRUCTION");
    const invalid = transitionDecisionContextLifecycle(draft, "ACTIVE");

    expect(valid.transition_valid).toBe(true);
    expect(valid.to_state).toBe("UNDER_CONSTRUCTION");
    expect(valid.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(invalid.transition_valid).toBe(false);
  });

  it("replays context without generating a new context", () => {
    const context = createDecisionContext();
    const replay = replayDecisionContext(context);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_validation_state).toBe("VALID");
    expect(replay.reconstructed_completeness_score).toBe(1);
    expect(replay.failures).toEqual([]);
  });

  it("publishes observability for context validation outcomes", () => {
    const valid = createDecisionContext();
    const invalid = { ...valid, integrity_hash: "tampered" };
    const missing = createDecisionContext({ domain_overrides: { replay_context: { status: "MISSING", replay_reference: "" } } });

    const metrics = buildDecisionContextObservability([valid, invalid, missing]);

    expect(metrics.contexts_created).toBe(3);
    expect(metrics.validation_failures).toBe(2);
    expect(metrics.replay_failures).toBeGreaterThan(0);
    expect(metrics.integrity_failures).toBeGreaterThan(0);
    expect(metrics.average_completeness_score).toBeGreaterThan(0);
    expect(metrics.lifecycle_distribution.DRAFT).toBe(3);
  });
});
