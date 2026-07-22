import { describe, expect, it } from "vitest";
import {
  CERTIFICATION_CATEGORIES,
  CERTIFICATION_VALIDATION_OUTCOMES,
  REPLAY_REQUIREMENT_STATUSES,
  computeCertificationRequirementHash,
  computeReplayArtifactHash,
  createCertificationRequirements,
  createReplayArtifacts,
  getCertificationReplayValidatorFoundation,
  replayCertificationReplayValidation,
  validateCertificationAndReplay,
} from "@/services/certification-replay-requirement-validator";
import { createGovernanceDecisionRecord } from "@/services/governance-decision-filter-contract";

describe("Mission Control Phase 9.7.6 Certification & Replay Requirement Validator", () => {
  it("publishes the certification replay validator foundation", () => {
    const foundation = getCertificationReplayValidatorFoundation();

    expect(foundation.validator_version).toBe("certification-replay-requirement-validator/v1");
    expect(foundation.certification_categories).toEqual(CERTIFICATION_CATEGORIES);
    expect(foundation.validation_outcomes).toEqual(CERTIFICATION_VALIDATION_OUTCOMES);
    expect(foundation.replay_statuses).toEqual(REPLAY_REQUIREMENT_STATUSES);
    expect(foundation.result.certification_replay_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("validates certification requirements and replay artifacts deterministically", () => {
    const first = validateCertificationAndReplay();
    const second = validateCertificationAndReplay();

    expect(first).toEqual(second);
    expect(first.evidence_package.validation_outcome).toBe("VERIFIED");
    expect(first.evidence_package.replay_completeness).toBe("COMPLETE");
    expect(first.replay_report.reconstruction_status).toBe("RECONSTRUCTED");
    expect(first.ledger_records).toHaveLength(1);
  });

  it("rejects missing, expired, revoked, duplicate, and invalid certification requirements", () => {
    const decision = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
    const requirements = createCertificationRequirements(decision);
    const expired = [{ ...requirements[0], certification_status: "EXPIRED" as const, integrity_hash: computeCertificationRequirementHash({ ...requirements[0], certification_status: "EXPIRED" as const }) }];
    const revoked = [{ ...requirements[0], revoked: true, integrity_hash: computeCertificationRequirementHash({ ...requirements[0], revoked: true }) }];
    const invalidVersion = [{ ...requirements[0], certification_version: "bad" as never, integrity_hash: computeCertificationRequirementHash({ ...requirements[0], certification_version: "bad" as never }) }];

    expect(validateCertificationAndReplay({ governance_decision: decision, certification_requirements: [] }).failures).toContain("MISSING_CERTIFICATION");
    expect(validateCertificationAndReplay({ governance_decision: decision, certification_requirements: [requirements[0], requirements[0]] }).failures).toContain("DUPLICATE_CERTIFICATION_IDENTIFIER");
    expect(validateCertificationAndReplay({ governance_decision: decision, certification_requirements: expired }).failures).toContain("EXPIRED_CERTIFICATION");
    expect(validateCertificationAndReplay({ governance_decision: decision, certification_requirements: revoked }).failures).toContain("REVOKED_CERTIFICATION");
    expect(validateCertificationAndReplay({ governance_decision: decision, certification_requirements: invalidVersion }).failures).toContain("INVALID_CERTIFICATION_VERSION");
  });

  it("rejects missing, incomplete, unresolved, and divergent replay packages", () => {
    const decision = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
    const artifacts = createReplayArtifacts(decision);
    const partial = artifacts.slice(0, 2);
    const unavailable = [{ ...artifacts[0], available: false, integrity_hash: computeReplayArtifactHash({ ...artifacts[0], available: false }) }];
    const unresolved = [{ ...artifacts[0], replay_ref: "", integrity_hash: computeReplayArtifactHash({ ...artifacts[0], replay_ref: "" }) }];
    const divergent = [{ ...artifacts[0], deterministic: false, integrity_hash: computeReplayArtifactHash({ ...artifacts[0], deterministic: false }) }];

    expect(validateCertificationAndReplay({ governance_decision: decision, replay_artifacts: [] }).failures).toContain("MISSING_REPLAY_ARTIFACTS");
    expect(validateCertificationAndReplay({ governance_decision: decision, replay_artifacts: partial }).failures).toContain("INCOMPLETE_REPLAY_PACKAGE");
    expect(validateCertificationAndReplay({ governance_decision: decision, replay_artifacts: unavailable }).failures).toContain("MISSING_REPLAY_ARTIFACTS");
    expect(validateCertificationAndReplay({ governance_decision: decision, replay_artifacts: unresolved }).failures).toContain("UNRESOLVED_REPLAY_REFERENCES");
    expect(validateCertificationAndReplay({ governance_decision: decision, replay_artifacts: divergent }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("rejects broken lineage, scope mismatch, invalid tenant isolation, unauthorized access, and replay mismatches", () => {
    const valid = validateCertificationAndReplay();
    const decision = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
    const brokenLineage = createCertificationRequirements(decision).map((item, index) => index === 0 ? { ...item, required_lineage: [], integrity_hash: computeCertificationRequirementHash({ ...item, required_lineage: [] }) } : item);
    const scopeMismatch = createCertificationRequirements(decision).map((item, index) => index === 0 ? { ...item, tenant_id: "tenant_beta", integrity_hash: computeCertificationRequirementHash({ ...item, tenant_id: "tenant_beta" }) } : item);
    const badTenant = { ...valid.tenant_result!, tenant_isolation_status: "FAIL" as const };

    expect(validateCertificationAndReplay({ governance_decision: decision, certification_requirements: brokenLineage }).failures).toContain("BROKEN_CERTIFICATION_LINEAGE");
    expect(validateCertificationAndReplay({ governance_decision: decision, certification_requirements: scopeMismatch }).failures).toContain("CERTIFICATION_SCOPE_MISMATCH");
    expect(validateCertificationAndReplay({ tenant_result: badTenant }).failures).toContain("TENANT_ISOLATION_INVALID");
    expect(validateCertificationAndReplay({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_CERTIFICATION_REPLAY_VALIDATOR_ACCESS");
    expect(validateCertificationAndReplay({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("replays certification packages, replay reports, and ledgers deterministically", () => {
    const result = validateCertificationAndReplay();
    const replay = replayCertificationReplayValidation(result);
    const tampered = replayCertificationReplayValidation({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.governance_decision_id).toBe(result.governance_decision.governance_decision_id);
    expect(replay.certification_refs).toEqual(result.certification_requirements.map((item) => item.certification_requirement_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
