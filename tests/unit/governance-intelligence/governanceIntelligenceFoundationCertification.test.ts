import { describe, expect, it } from "vitest";
import {
  buildGovernanceFoundationCertificationInputPackage,
  buildGovernanceIntelligenceRecord,
  generateGovernanceIntelligenceIdentity,
  runGovernanceFoundationCertificationGate,
} from "@/services/governance-intelligence";

describe("Mission Control Phase 7A.5 Foundation Certification Gate", () => {
  it("certifies the default Governance Intelligence foundation", () => {
    const result = runGovernanceFoundationCertificationGate();
    expect(result.certification_state).toBe("PASS");
    expect(result.phase_7b_ready).toBe(true);
    expect(result.critical_failures).toEqual([]);
    expect(result.contract_result.validation_status).toBe("PASS");
    expect(result.state_machine_result.validation_status).toBe("PASS");
    expect(result.identity_result.validation_status).toBe("PASS");
    expect(result.lifecycle_result.validation_status).toBe("PASS");
    expect(result.decision.phase_7b_readiness).toBe(true);
  });

  it("retains certification evidence and Truth Ledger references", () => {
    const result = runGovernanceFoundationCertificationGate();
    expect(result.evidence_refs.length).toBeGreaterThan(0);
    expect(result.lineage_refs.length).toBeGreaterThan(0);
    expect(result.replay_refs.length).toBeGreaterThan(0);
    expect(result.truth_ledger_refs.length).toBeGreaterThan(0);
    expect(result.auditability_result.tests_passed).toContain("certification evidence retained");
  });

  it("produces a reproducible certification hash", () => {
    expect(runGovernanceFoundationCertificationGate().certification_hash).toBe(runGovernanceFoundationCertificationGate().certification_hash);
  });

  it("returns conditional pass for non-critical findings", () => {
    const result = runGovernanceFoundationCertificationGate({
      conditional_findings: ["documentation retest scheduled"],
    });
    expect(result.certification_state).toBe("CONDITIONAL_PASS");
    expect(result.phase_7b_ready).toBe(true);
    expect(result.decision.remediation_required).toBe(true);
  });

  it("fails closed when the contract is missing", () => {
    const result = runGovernanceFoundationCertificationGate({ contract_record: undefined, certification_package_id: "missing_contract_package" });
    expect(result.certification_state).toBe("FAIL");
    expect(result.phase_7b_ready).toBe(false);
    expect(result.contract_result.failure_reasons).toContain("CONTRACT_MISSING");
  });

  it("fails when required fields are not enforced", () => {
    const badRecord = buildGovernanceIntelligenceRecord({ governance_intelligence_id: "" });
    const result = runGovernanceFoundationCertificationGate({ contract_record: badRecord });
    expect(result.certification_state).toBe("FAIL");
    expect(result.contract_result.failure_reasons).toContain("CONTRACT_SCHEMA_INVALID");
  });

  it("detects duplicate identity during certification", () => {
    const identity = generateGovernanceIntelligenceIdentity();
    const result = runGovernanceFoundationCertificationGate({
      identity,
      identity_registry: [identity, identity],
    });
    expect(result.certification_state).toBe("FAIL");
    expect(result.identity_result.failure_reasons).toContain("IDENTITY_DUPLICATE");
  });

  it("fails replay certification when replay refs are missing", () => {
    const result = runGovernanceFoundationCertificationGate({
      replay_refs: [],
      contract_record: buildGovernanceIntelligenceRecord({ replay_refs: [] }),
    });
    expect(result.certification_state).toBe("FAIL");
    expect(result.replay_result.failure_reasons).toContain("REPLAY_REFS_MISSING");
  });

  it("blocks Phase 7B on critical lifecycle failure", () => {
    const input = buildGovernanceFoundationCertificationInputPackage();
    const result = runGovernanceFoundationCertificationGate({
      ...input,
      lifecycle_events: [],
    });
    expect(result.certification_state).toBe("FAIL");
    expect(result.phase_7b_ready).toBe(false);
    expect(result.lifecycle_result.failure_reasons).toContain("LIFECYCLE_EVENT_MISSING");
  });

  it("records tested components and report summary", () => {
    const result = runGovernanceFoundationCertificationGate({}, { certification_actor: "gate_operator" });
    expect(result.decision.tested_components).toEqual(["contract", "state_machine", "identity", "tenant_isolation", "lifecycle", "lineage", "replay", "immutability", "auditability"]);
    expect(result.certification_actor).toBe("gate_operator");
    expect(result.decision.result_summary).toContain("Phase 7A foundation certified");
  });
});
