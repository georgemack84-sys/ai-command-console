import { describe, expect, it } from "vitest";
import {
  DECISION_PACKAGE_ALLOWED_TRANSITIONS,
  DECISION_PACKAGE_LIFECYCLE_STATES,
  computeOperatorDecisionPackageHash,
  createOperatorDecisionPackage,
  createPackageLifecycleState,
  getDecisionPackageContractFoundation,
  replayDecisionPackageContract,
  validateDecisionPackageContract,
} from "@/services/decision-package-contract";

describe("Mission Control Phase 9.8.1 Decision Package Contract", () => {
  it("publishes the decision package contract foundation", () => {
    const foundation = getDecisionPackageContractFoundation();

    expect(foundation.contract_version).toBe("decision-package-contract/v1");
    expect(foundation.lifecycle_states).toEqual(DECISION_PACKAGE_LIFECYCLE_STATES);
    expect(foundation.allowed_transitions).toEqual(DECISION_PACKAGE_ALLOWED_TRANSITIONS);
    expect(foundation.result.contract_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("creates deterministic canonical operator decision packages", () => {
    const first = validateDecisionPackageContract();
    const second = validateDecisionPackageContract();

    expect(first).toEqual(second);
    expect(first.package.package_version).toBe("operator-decision-package/v1");
    expect(first.package.metadata.schema_version).toBe("operator-decision-package-schema/v1");
    expect(first.package.advisory_only).toBe(true);
    expect(first.package.recommended_option.evidence_refs.length).toBeGreaterThan(0);
  });

  it("validates schema, metadata, lifecycle, replay, governance, constitutional, authority, and tenant fields", () => {
    const result = validateDecisionPackageContract();

    expect(result.validation.schema_valid).toBe(true);
    expect(result.validation.lifecycle_valid).toBe(true);
    expect(result.validation.integrity_valid).toBe(true);
    expect(result.validation.replay_valid).toBe(true);
    expect(result.validation.governance_valid).toBe(true);
    expect(result.validation.constitutional_valid).toBe(true);
    expect(result.validation.authority_valid).toBe(true);
    expect(result.validation.tenant_valid).toBe(true);
  });

  it("rejects missing required fields and invalid versions", () => {
    const pkg = createOperatorDecisionPackage();
    const missingId = { ...pkg, package_id: "", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, package_id: "" }) };
    const invalidVersion = { ...pkg, package_version: "operator-decision-package/v999" as never, integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, package_version: "operator-decision-package/v999" as never }) };

    expect(validateDecisionPackageContract({ package: missingId }).failures).toContain("PACKAGE_ID_MISSING");
    expect(validateDecisionPackageContract({ package: invalidVersion }).failures).toContain("VERSION_INVALID");
  });

  it("rejects invalid lifecycle transitions, replay gaps, lineage gaps, and tenant mismatches", () => {
    const pkg = createOperatorDecisionPackage();
    const invalidLifecycle = createPackageLifecycleState(pkg.package_id, "PRESENTED", "BUILDING");
    const missingReplay = { ...pkg, replay_ref: "", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, replay_ref: "" }) };
    const missingLineage = { ...pkg, lineage_ref: "", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, lineage_ref: "" }) };
    const wrongTenant = { ...pkg, tenant_id: "tenant_beta", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, tenant_id: "tenant_beta" }) };

    expect(validateDecisionPackageContract({ package: pkg, lifecycle: invalidLifecycle }).failures).toContain("LIFECYCLE_INVALID");
    expect(validateDecisionPackageContract({ package: missingReplay }).failures).toContain("REPLAY_REFERENCE_MISSING");
    expect(validateDecisionPackageContract({ package: missingLineage }).failures).toContain("LINEAGE_REFERENCE_MISSING");
    expect(validateDecisionPackageContract({ package: wrongTenant }).failures).toContain("TENANT_MISMATCH");
  });

  it("rejects missing governance, constitutional, authority, integrity, and advisory-only guarantees", () => {
    const pkg = createOperatorDecisionPackage();
    const noGovernance = { ...pkg, governance_summary: "", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, governance_summary: "" }) };
    const noConstitutional = { ...pkg, constitutional_summary: "", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, constitutional_summary: "" }) };
    const noAuthority = { ...pkg, authority_summary: "", integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, authority_summary: "" }) };
    const tampered = { ...pkg, rationale: "tampered" };
    const executionPackage = { ...pkg, advisory_only: false as true, integrity_hash: computeOperatorDecisionPackageHash({ ...pkg, advisory_only: false as true }) };

    expect(validateDecisionPackageContract({ package: noGovernance }).failures).toContain("GOVERNANCE_SUMMARY_MISSING");
    expect(validateDecisionPackageContract({ package: noConstitutional }).failures).toContain("CONSTITUTIONAL_SUMMARY_MISSING");
    expect(validateDecisionPackageContract({ package: noAuthority }).failures).toContain("AUTHORITY_INFORMATION_MISSING");
    expect(validateDecisionPackageContract({ package: tampered }).failures).toContain("INTEGRITY_HASH_MISSING");
    expect(validateDecisionPackageContract({ package: executionPackage }).failures).toContain("ADVISORY_ONLY_VIOLATION");
  });

  it("rejects unauthorized validation and replay divergence", () => {
    const valid = validateDecisionPackageContract();

    expect(validateDecisionPackageContract({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_PACKAGE_CONTRACT_ACCESS");
    expect(validateDecisionPackageContract({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("replays package contract validation deterministically", () => {
    const result = validateDecisionPackageContract();
    const replay = replayDecisionPackageContract(result);
    const tampered = replayDecisionPackageContract({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.package_id).toBe(result.package.package_id);
    expect(replay.lifecycle_state).toBe("READY_FOR_PRESENTATION");
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
