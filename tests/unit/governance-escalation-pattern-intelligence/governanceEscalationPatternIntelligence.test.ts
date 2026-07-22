import { describe, expect, it } from "vitest";
import {
  analyzeGovernanceEscalationPatterns,
  computeGovernancePatternHash,
  getGovernanceEscalationPatternFoundation,
  replayGovernanceEscalationPatterns,
} from "@/services/governance-escalation-pattern-intelligence";
import type { GovernanceEscalationFailure, GovernanceEscalationScenario } from "@/types/governance-escalation-pattern-intelligence";

describe("Mission Control Phase 10.4.6 Governance & Escalation Pattern Intelligence", () => {
  it("publishes the governance escalation pattern foundation", () => {
    const foundation = getGovernanceEscalationPatternFoundation();

    expect(foundation.governance_escalation_pattern_intelligence_version).toBe("governance-escalation-pattern-intelligence/v1");
    expect(foundation.api_surface.analyze_governance_patterns).toBe("POST /governance-escalation-pattern-intelligence/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("detects governance patterns from scored pattern intelligence deterministically", () => {
    const first = analyzeGovernanceEscalationPatterns();
    const second = analyzeGovernanceEscalationPatterns();

    expect(first.governance_pattern_records[0].governance_pattern_type).toBe(second.governance_pattern_records[0].governance_pattern_type);
    expect(first.governance_pattern_records[0].governance_severity).toBe(second.governance_pattern_records[0].governance_severity);
    expect(first.governance_pattern_records[0].escalation_level).toBe(second.governance_pattern_records[0].escalation_level);
  });

  it("classifies constitutional, authority, certification, and bottleneck patterns", () => {
    expect(analyzeGovernanceEscalationPatterns({ scenario: "CONSTITUTIONAL_RISK" }).governance_pattern_records[0].governance_pattern_type).toBe("CONSTITUTIONAL_RISK");
    expect(analyzeGovernanceEscalationPatterns({ scenario: "AUTHORITY_CONFLICT" }).governance_pattern_records[0].governance_pattern_type).toBe("AUTHORITY_CONFLICT");
    expect(analyzeGovernanceEscalationPatterns({ scenario: "CERTIFICATION_FAILURE" }).governance_pattern_records[0].governance_pattern_type).toBe("CERTIFICATION_FAILURE_PATTERN");
    expect(analyzeGovernanceEscalationPatterns({ scenario: "APPROVAL_BOTTLENECK" }).governance_pattern_records[0].governance_pattern_type).toBe("APPROVAL_DELAY_PATTERN");
  });

  it("generates deterministic advisory escalation recommendations", () => {
    const result = analyzeGovernanceEscalationPatterns({ scenario: "CONSTITUTIONAL_RISK" });
    const record = result.governance_pattern_records[0];

    expect(record.escalation_required).toBe(true);
    expect(record.escalation_level).toBe("LEVEL_4_CONSTITUTIONAL");
    expect(record.recommended_governance_action).toContain("Constitutional review");
    expect(record.advisory_only).toBe(true);
  });

  it("preserves advisory-only behavior and never mutates governance, authority, policy, or execution", () => {
    const result = analyzeGovernanceEscalationPatterns();
    const record = result.governance_pattern_records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.automatic_enforcement).toBe(false);
    expect(result.modifies_policy).toBe(false);
    expect(result.modifies_authority).toBe(false);
    expect(result.modifies_certification).toBe(false);
    expect(result.blocks_execution).toBe(false);
    expect(record.automatic_enforcement).toBe(false);
    expect(record.blocks_execution).toBe(false);
  });

  it("records immutable append-only governance pattern registry entries", () => {
    const result = analyzeGovernanceEscalationPatterns();
    const record = result.governance_pattern_records[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.governance_pattern_refs).toEqual([record.governance_pattern_id]);
    expect(result.registry.pattern_refs).toEqual([record.pattern_id]);
  });

  it("creates stable governance pattern hashes and replay output", () => {
    const result = analyzeGovernanceEscalationPatterns();
    const record = result.governance_pattern_records[0];

    expect(computeGovernancePatternHash(record)).toBe(record.integrity_hash);
    expect(replayGovernanceEscalationPatterns(result)).toBe(true);
  });

  it("validates governance lineage, constitutional references, authority, certification, replay, tenant isolation, and integrity", () => {
    const result = analyzeGovernanceEscalationPatterns();

    expect(result.validation.governance_lineage_complete).toBe(true);
    expect(result.validation.constitutional_references_complete).toBe(true);
    expect(result.validation.authority_references_complete).toBe(true);
    expect(result.validation.certification_evidence_available).toBe(true);
    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["MISSING_SCORING", "SCORED_PATTERN_MISSING"],
    ["REJECTED_SCORING", "SCORING_INPUT_REJECTED"],
    ["MISSING_GOVERNANCE_LINEAGE", "GOVERNANCE_LINEAGE_MISSING"],
    ["MISSING_CONSTITUTIONAL_REFS", "CONSTITUTIONAL_REFERENCES_MISSING"],
    ["MISSING_AUTHORITY_REFS", "AUTHORITY_REFERENCES_INCOMPLETE"],
    ["MISSING_CERTIFICATION_EVIDENCE", "CERTIFICATION_EVIDENCE_UNAVAILABLE"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_INCOMPLETE"],
    ["MISSING_RULE_VERSION", "ESCALATION_RULE_VERSION_UNAVAILABLE"],
    ["REPLAY_DIVERGENCE", "SCORING_INPUT_REJECTED"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["MISSING_EXPLANATION", "EXPLANATION_MISSING"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["AUTONOMOUS_GOVERNANCE_ACTION", "AUTONOMOUS_GOVERNANCE_ACTION_DETECTED"],
    ["AUTHORITY_MUTATION", "AUTHORITY_MUTATION_DETECTED"],
    ["POLICY_MUTATION", "POLICY_MUTATION_DETECTED"],
    ["NONDETERMINISTIC_ESCALATION", "NONDETERMINISTIC_ESCALATION_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [GovernanceEscalationScenario, GovernanceEscalationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeGovernanceEscalationPatterns({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.automatic_enforcement).toBe(false);
  });

  it("keeps missing certification evidence pending instead of certified", () => {
    const result = analyzeGovernanceEscalationPatterns({ scenario: "MISSING_CERTIFICATION_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.certification_evidence_available).toBe(false);
  });

  it("detects governance analysis tampering during replay", () => {
    const result = analyzeGovernanceEscalationPatterns();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayGovernanceEscalationPatterns(tampered)).toBe(false);
  });
});
