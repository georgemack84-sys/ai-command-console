import { describe, expect, it } from "vitest";
import {
  buildAuthorityValidationPackage,
  buildAuthorityValidationVisibilitySurface,
  computeAuthorityValidationResultHash,
  getAuthorityValidationFramework,
  replayAuthorityValidation,
  validateClassificationAuthority,
} from "@/services/authority-validation-engine";
import type { AuthorityValidationFailureReason, AuthorityValidationScenario } from "@/types/authority-validation-engine";

describe("Mission Control Phase 8D.3 Authority Validation Engine", () => {
  it("publishes authority validation doctrine", () => {
    const framework = getAuthorityValidationFramework();

    expect(framework.doctrine.engine_version).toBe("authority-validation-engine/v8D.3");
    expect(framework.doctrine.principles).toContain("governance-supremacy");
    expect(framework.doctrine.principles).toContain("certified-agent-only");
    expect(framework.doctrine.decisions).toEqual(["AUTHORIZED", "REJECTED"]);
    expect(framework.doctrine.states).toContain("TENANT_VALIDATED");
  });

  it("authorizes a baseline classified delegation", () => {
    const pkg = buildAuthorityValidationPackage();

    expect(pkg.validation.decision).toBe("AUTHORIZED");
    expect(pkg.validation.final_state).toBe("AUTHORIZED");
    expect(pkg.validation.failures).toEqual([]);
    expect(pkg.validation.constitutional_authority_valid).toBe(true);
    expect(pkg.validation.policy_compliance_valid).toBe(true);
    expect(pkg.validation.agent_certification_valid).toBe(true);
    expect(pkg.validation.tenant_isolation_valid).toBe(true);
    expect(pkg.validation.governance_evidence_recorded).toBe(true);
  });

  it("records immutable evidence, replay, and truth-ledger entry", () => {
    const pkg = buildAuthorityValidationPackage();
    const replay = replayAuthorityValidation(pkg.validation);

    expect(pkg.validation.result_hash).toBe(computeAuthorityValidationResultHash(pkg.validation));
    expect(pkg.validation.evidence.domain_result_hashes).toEqual(pkg.validation.domain_results.map((domain) => domain.result_hash));
    expect(replay.reconstructed_decision).toBe("AUTHORIZED");
    expect(replay.reconstructed_domain_states).toContain("CONSTITUTION_VALIDATED");
    expect(pkg.ledger_entry.append_only).toBe(true);
    expect(pkg.ledger_entry.evidence_hash).toBe(pkg.validation.evidence.integrity_hash);
  });

  it.each([
    ["BLOCKED_CLASSIFICATION", "UNAUTHORIZED_DELEGATION"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION"],
    ["UNAUTHORIZED_DELEGATION", "UNAUTHORIZED_DELEGATION"],
    ["MISSING_APPROVAL", "MISSING_APPROVAL"],
    ["EXPIRED_CERTIFICATION", "EXPIRED_CERTIFICATION"],
    ["INSUFFICIENT_CAPABILITY", "INSUFFICIENT_CAPABILITY"],
    ["INADEQUATE_TRUST_SCORE", "INADEQUATE_TRUST_SCORE"],
    ["POLICY_CONFLICT", "POLICY_CONFLICT"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY"],
    ["INCOMPLETE_VALIDATION_EVIDENCE", "INCOMPLETE_VALIDATION_EVIDENCE"],
    ["INTEGRITY_FAILURE", "INTEGRITY_FAILURE"],
  ] as readonly [AuthorityValidationScenario, AuthorityValidationFailureReason][])("rejects %s", (scenario, reason) => {
    const pkg = buildAuthorityValidationPackage({ scenario });

    expect(pkg.validation.decision).toBe("REJECTED");
    expect(pkg.validation.failures).toContain(reason);
    expect(pkg.replay.validation_state).toBe("FAIL");
    expect(pkg.visibility).toBeUndefined();
  });

  it("maps blocked classification failures into authority rejection", () => {
    const result = validateClassificationAuthority({ scenario: "BLOCKED_CLASSIFICATION" });

    expect(result.decision).toBe("REJECTED");
    expect(result.final_state).toBe("REJECTED");
    expect(result.governance_authority_valid).toBe(false);
    expect(result.failures).toContain("UNAUTHORIZED_DELEGATION");
  });

  it("preserves deterministic outputs for identical inputs", () => {
    const first = buildAuthorityValidationPackage();
    const second = buildAuthorityValidationPackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(second.validation.result_hash).toBe(first.validation.result_hash);
    expect(second.replay.replay_hash).toBe(first.replay.replay_hash);
    expect(second.ledger_entry.ledger_hash).toBe(first.ledger_entry.ledger_hash);
  });

  it("exposes authority validation visibility", () => {
    const pkg = buildAuthorityValidationPackage({ scenario: "INADEQUATE_TRUST_SCORE" });
    const surface = buildAuthorityValidationVisibilitySurface(pkg);

    expect(surface.decision).toBe("REJECTED");
    expect(surface.final_state).toBe("CERTIFICATION_FAILURE");
    expect(surface.failure_reasons).toContain("INADEQUATE_TRUST_SCORE");
    expect(surface.trust_score).toBeLessThan(0.7);
    expect(surface.integrity_status).toBe("VALID");
  });
});
