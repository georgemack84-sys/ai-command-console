import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_BOUNDARY_CHECKS,
  ADAPTIVE_DOMAIN_CLASSIFICATIONS,
  computeAdaptiveDomainHash,
  getAdaptiveDomainBoundaryFoundation,
  replayAdaptiveDomainBoundaryModel,
  runAdaptiveDomainBoundaryModel,
} from "@/services/adaptive-domain-boundary-model";
import type { AdaptiveBoundaryFailure, AdaptiveBoundaryInput } from "@/types/adaptive-domain-boundary-model";

describe("Mission Control Phase 10.0.2 Adaptive Domain Boundary Model", () => {
  it("publishes the adaptive domain boundary foundation", () => {
    const foundation = getAdaptiveDomainBoundaryFoundation();

    expect(foundation.boundary_version).toBe("adaptive-domain-boundary-model/v1");
    expect(foundation.checks).toEqual(ADAPTIVE_BOUNDARY_CHECKS);
    expect(foundation.classifications).toEqual(ADAPTIVE_DOMAIN_CLASSIFICATIONS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("classifies allowed, restricted, and prohibited domains", () => {
    const result = runAdaptiveDomainBoundaryModel();

    expect(result.registry.allowed_domain_ids.length).toBeGreaterThan(0);
    expect(result.registry.restricted_domain_ids.length).toBeGreaterThan(0);
    expect(result.registry.prohibited_domain_ids.length).toBeGreaterThan(0);
    expect(result.registry.default_decision).toBe("REJECT");
  });

  it("preserves domain definition integrity", () => {
    const result = runAdaptiveDomainBoundaryModel();
    const domain = result.registry.domains[0];

    expect(computeAdaptiveDomainHash(domain)).toBe(domain.integrity_hash);
    expect(domain.replay_required).toBe(true);
    expect(domain.certification_required).toBe(true);
    expect(domain.mutation_allowed).toBe(false);
  });

  it("allows recommendation for explicitly allowed domains", () => {
    const result = runAdaptiveDomainBoundaryModel({ domain_id: "domain:recommendation-quality", operation: "RECOMMEND" });

    expect(result.enforcement_result.validation_result).toBe("PASS");
    expect(result.enforcement_result.classification).toBe("ALLOWED");
    expect(result.validation.validation_status).toBe("VALID");
  });

  it("restricts recommendation for governance-sensitive domains", () => {
    const result = runAdaptiveDomainBoundaryModel({ domain_id: "domain:policy-evaluation", operation: "RECOMMEND" });

    expect(result.enforcement_result.validation_result).toBe("RESTRICT");
    expect(result.enforcement_result.classification).toBe("RESTRICTED");
    expect(result.enforcement_result.operator_review_required).toBe(true);
    expect(result.validation.validation_status).toBe("VALID");
  });

  it("rejects prohibited mutation and unknown domains by default", () => {
    const prohibited = runAdaptiveDomainBoundaryModel({ domain_id: "domain:constitution", operation: "MUTATE" });
    const unknown = runAdaptiveDomainBoundaryModel({ domain_id: "domain:unknown", operation: "ANALYZE" });

    expect(prohibited.enforcement_result.validation_result).toBe("REJECT");
    expect(prohibited.validation.failures).toContain("PROHIBITED_MUTATION");
    expect(unknown.enforcement_result.validation_result).toBe("REJECT");
    expect(unknown.validation.failures).toContain("UNKNOWN_DOMAIN");
  });

  it("records replayable boundary decisions and append-only ledger entries", () => {
    const result = runAdaptiveDomainBoundaryModel();

    expect(result.replay_model.deterministic_reconstruction).toBe(true);
    expect(result.replay_model.integrity_reproducible).toBe(true);
    expect(result.boundary_ledger.map((entry) => entry.sequence_number)).toEqual([1]);
    expect(result.boundary_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("remains replayable, advisory-only, and non-executing", () => {
    const result = runAdaptiveDomainBoundaryModel();

    expect(replayAdaptiveDomainBoundaryModel(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.permits_execution).toBe(false);
    expect(result.mutates_domain_registry).toBe(false);
  });

  it.each([
    ["CONTRACT_INVALID", "CONTRACT_FOUNDATION_INVALID"],
    ["UNKNOWN_DOMAIN", "UNKNOWN_DOMAIN"],
    ["HIDDEN_DOMAIN", "HIDDEN_ADAPTIVE_DOMAIN"],
    ["UNAUTHORIZED_DOMAIN_CREATION", "UNAUTHORIZED_DOMAIN_CREATION"],
    ["CLASSIFICATION_MISSING", "CLASSIFICATION_MISSING"],
    ["PERMISSION_MISMATCH", "PERMISSION_CLASSIFICATION_MISMATCH"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REQUIREMENTS_MISSING"],
    ["MISSING_OPERATOR_REVIEW", "OPERATOR_REVIEW_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REQUIREMENTS_MISSING"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_REQUIREMENTS_MISSING"],
    ["INVALID_CONSTITUTION", "CONSTITUTIONAL_REFERENCE_INVALID"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BREACH"],
    ["CROSS_TENANT_MEMORY", "CROSS_TENANT_MEMORY_SHARING"],
    ["PROHIBITED_RECOMMENDATION", "PROHIBITED_RECOMMENDATION"],
    ["PROHIBITED_MUTATION", "PROHIBITED_MUTATION"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
    ["INHERITANCE_WEAKENED", "INHERITED_BOUNDARY_WEAKENED"],
    ["REPLAY_MISMATCH", "BOUNDARY_REPLAY_MISMATCH"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["FAIL_OPEN", "FAIL_OPEN_BOUNDARY_BEHAVIOR"],
  ] as readonly [NonNullable<AdaptiveBoundaryInput["scenario"]>, AdaptiveBoundaryFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runAdaptiveDomainBoundaryModel({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.certification_report.certification_decision).toBe("FAIL");
    expect(result.permits_execution).toBe(false);
  });

  it("fails closed when the role lacks adaptive boundary visibility", () => {
    const result = runAdaptiveDomainBoundaryModel({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects adaptive boundary tampering", () => {
    const result = runAdaptiveDomainBoundaryModel();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptiveDomainBoundaryModel(tampered)).toBe(false);
  });
});
