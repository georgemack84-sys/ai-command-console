import { describe, expect, it } from "vitest";

import {
  getStrategicGovernanceEnforcementContract,
  replayStrategicGovernanceEnforcement,
  runStrategicGovernanceEnforcement,
  validateStrategicGovernanceEnforcement,
} from "../../../services/strategic-governance-enforcement";
import type { StrategicGovernanceScenario } from "../../../types/strategic-governance-enforcement";

describe("strategic governance enforcement", () => {
  it("creates deterministic certified governance enforcement", () => {
    const first = runStrategicGovernanceEnforcement();
    const second = runStrategicGovernanceEnforcement();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.certified).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateStrategicGovernanceEnforcement(first).valid).toBe(true);
    expect(replayStrategicGovernanceEnforcement(first)).toBe(true);
  });

  it("publishes governance, security, and authority doctrine", () => {
    const bundle = getStrategicGovernanceEnforcementContract();

    expect(bundle.doctrine.constitutional_validation_required).toBe(true);
    expect(bundle.doctrine.advisory_only_authority).toBe(true);
    expect(bundle.doctrine.operator_supremacy_required).toBe(true);
    expect(bundle.doctrine.evidence_qualification_required).toBe(true);
    expect(bundle.doctrine.trust_qualification_required).toBe(true);
    expect(bundle.doctrine.tenant_isolation_required).toBe(true);
    expect(bundle.doctrine.restricted_data_protection_required).toBe(true);
    expect(bundle.doctrine.security_validation_required).toBe(true);
    expect(bundle.doctrine.deterministic_fail_closed_required).toBe(true);
  });

  it("enforces constitutional governance, advisory authority, and operator supremacy", () => {
    const result = runStrategicGovernanceEnforcement();

    expect(result.constitution.approved).toBe(true);
    expect(result.governance.outcome).toBe("APPROVED");
    expect(result.authority.authority_ceiling).toBe("ADVISORY_ONLY");
    expect(result.authority.execution_authority_granted).toBe(false);
    expect(result.operator.operator_supremacy_preserved).toBe(true);
    expect(result.operator.auto_approval_prevented).toBe(true);
  });

  it("qualifies evidence and trust while preserving tenant and data boundaries", () => {
    const result = runStrategicGovernanceEnforcement();

    expect(result.evidence.qualified).toBe(true);
    expect(result.evidence.sufficiency_score).toBeGreaterThanOrEqual(0.75);
    expect(result.trust.qualified).toBe(true);
    expect(result.trust.execution_authority_granted).toBe(false);
    expect(result.tenant.cross_tenant_access_detected).toBe(false);
    expect(result.restricted_data.unauthorized_disclosure_prevented).toBe(true);
  });

  it("verifies security, fail-closed state machine, ledger, and observability", () => {
    const result = runStrategicGovernanceEnforcement();

    expect(result.security.outcome).toBe("VERIFIED");
    expect(result.fail_closed.state).toBe("COMPLETE");
    expect(result.ledger.entries.map((entry) => entry.validation_stage)).toContain("ELIGIBLE_FOR_RECOMMENDATION");
    expect(result.ledger.append_only).toBe(true);
    expect(result.ledger.hash_linked).toBe(true);
    expect(result.observability.observable).toBe(true);
  });

  it("runs the phase 12.12 certification suite", () => {
    const result = runStrategicGovernanceEnforcement();

    expect(result.certification.tests).toHaveLength(14);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for mandatory governance and security violations", () => {
    const scenarios: readonly StrategicGovernanceScenario[] = [
      "CONSTITUTIONAL_FAILURE",
      "GOVERNANCE_FAILURE",
      "AUTHORITY_FAILURE",
      "POLICY_FAILURE",
      "EVIDENCE_FAILURE",
      "TRUST_FAILURE",
      "TENANT_FAILURE",
      "SECURITY_FAILURE",
      "REPLAY_FAILURE",
      "INTEGRITY_FAILURE",
      "UNKNOWN_FAILURE",
      "OPERATOR_SUPREMACY_FAILURE",
      "RESTRICTED_DATA_FAILURE",
      "LEDGER_FAILURE",
      "FAIL_CLOSED_FAILURE",
    ];

    for (const scenario of scenarios) {
      const result = runStrategicGovernanceEnforcement({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.certified).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(result.fail_closed.state).toBe("FAILED_CLOSED");
      expect(result.fail_closed.recommendation_issuance_allowed).toBe(false);
      expect(validateStrategicGovernanceEnforcement(result).valid).toBe(false);
    }
  });
});
