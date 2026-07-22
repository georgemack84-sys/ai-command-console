import { describe, expect, it } from "vitest";
import {
  buildMaturityDomainEvaluationObservabilitySurface,
  evaluateMaturityDomains,
  getMaturityDomainEvaluationEngineBundle,
  listMaturityDomainAuditLog,
  listMaturityDomainMetrics,
  listMaturityDomainReports,
  validateMaturityDomainEvaluation,
} from "@/services/maturity-domain-evaluation-engine";
import type { MaturityDomainEvaluationFailure, MaturityDomainEvaluationScenario } from "@/types/maturity-domain-evaluation-engine";

describe("maturity domain evaluation engine", () => {
  it("publishes the deterministic advisory-only engine bundle", () => {
    const bundle = getMaturityDomainEvaluationEngineBundle();

    expect(bundle.doctrine.engine_version).toBe("maturity-domain-evaluation-engine/v8ALT.11.2");
    expect(bundle.doctrine.final_state).toBe("MATURITY_DOMAIN_EVALUATION_ENGINE_READY");
    expect(bundle.doctrine.canonical_domain_count).toBe(10);
    expect(bundle.repository.final_state).toBe("MATURITY_DOMAIN_EVALUATION_COMPLETE");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.maturity_advancement_authorized).toBe(false);
    expect(bundle.repository.production_certification_authorized).toBe(false);
    expect(bundle.repository.governance_modification_authorized).toBe(false);
    expect(bundle.repository.authority_change_authorized).toBe(false);
    expect(bundle.repository.execution_behavior_change_authorized).toBe(false);
  });

  it("evaluates only the ten canonical contract domains", () => {
    const repository = evaluateMaturityDomains();
    const domains = repository.reports.map((report) => report.domain);

    expect(repository.contract.domains).toHaveLength(10);
    expect(repository.reports).toHaveLength(10);
    expect(domains).toEqual([
      "CONSTITUTIONAL_COMPLIANCE",
      "GOVERNANCE_COMPLIANCE",
      "AUTHORITY_ENFORCEMENT",
      "PLANNING_INTELLIGENCE",
      "EXECUTION_INTELLIGENCE",
      "REPLAY_INTEGRITY",
      "EXPLAINABILITY",
      "RESILIENCE",
      "VISIBILITY",
      "CERTIFICATION_READINESS",
    ]);
    expect(domains).not.toContain("RUNTIME_ASSURANCE");
    expect(repository.metrics.some((metric) => metric.metric_name === "runtime assurance" && metric.domain === "RESILIENCE")).toBe(true);
    expect(repository.metrics.some((metric) => metric.metric_name === "runtime behavior" && metric.domain === "EXECUTION_INTELLIGENCE")).toBe(true);
  });

  it("produces complete metrics, reports, evidence, and audit entries", () => {
    const repository = evaluateMaturityDomains();

    expect(repository.metrics).toHaveLength(31);
    expect(repository.audit_log).toHaveLength(10);
    expect(repository.reports.every((report) => report.maturity_state === "CERTIFIED")).toBe(true);
    expect(repository.reports.every((report) => report.domain_score === 92 && report.confidence_score === 94 && report.readiness_score === 90)).toBe(true);
    expect(repository.reports.every((report) => report.evidence.complete && report.evidence.replay_verified)).toBe(true);
    expect(repository.audit_log.every((entry) => entry.append_only && entry.integrity_hash)).toBe(true);
    expect(repository.failures).toEqual([]);
  });

  it("keeps evaluations deterministic and exposes slices", () => {
    const first = evaluateMaturityDomains();
    const second = evaluateMaturityDomains();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.reports[0]?.integrity_hash).toBe(first.reports[0]?.integrity_hash);
    expect(listMaturityDomainMetrics()).toHaveLength(31);
    expect(listMaturityDomainReports()).toHaveLength(10);
    expect(listMaturityDomainAuditLog()).toHaveLength(10);
  });

  it.each([
    ["INCOMPLETE_EVIDENCE", "DOMAIN_EVIDENCE_INCOMPLETE"],
    ["INCONSISTENT_RULES", "EVALUATION_RULES_INCONSISTENT"],
    ["DETERMINISTIC_CALCULATION_FAILURE", "DETERMINISTIC_CALCULATION_FAILED"],
    ["REPLAY_RECONSTRUCTION_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCHED"],
    ["GOVERNANCE_VALIDATION_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_VALIDATION_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["AUTHORITY_BYPASS", "AUTHORITY_ENFORCEMENT_BYPASSED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["HIDDEN_EVALUATION_LOGIC", "HIDDEN_EVALUATION_LOGIC_DETECTED"],
    ["NONDETERMINISTIC_SCORING", "NONDETERMINISTIC_SCORING_DETECTED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_BEHAVIOR_COMPROMISED"],
  ] satisfies [MaturityDomainEvaluationScenario, MaturityDomainEvaluationFailure][])("invalidates %s", (scenario, failure) => {
    const repository = evaluateMaturityDomains({ scenario });
    const validation = validateMaturityDomainEvaluation(repository);

    expect(repository.final_state).toBe("MATURITY_DOMAIN_EVALUATION_FAILED");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(repository.maturity_advancement_authorized).toBe(false);
    expect(repository.production_certification_authorized).toBe(false);
    expect(repository.execution_behavior_change_authorized).toBe(false);
  });

  it("reports failure-specific validation gates", () => {
    expect(validateMaturityDomainEvaluation(evaluateMaturityDomains({ scenario: "INCOMPLETE_EVIDENCE" })).evidence_complete).toBe(false);
    expect(validateMaturityDomainEvaluation(evaluateMaturityDomains({ scenario: "INCONSISTENT_RULES" })).rules_consistent).toBe(false);
    expect(validateMaturityDomainEvaluation(evaluateMaturityDomains({ scenario: "DETERMINISTIC_CALCULATION_FAILURE" })).deterministic_calculations).toBe(false);
    expect(validateMaturityDomainEvaluation(evaluateMaturityDomains({ scenario: "REPLAY_RECONSTRUCTION_MISMATCH" })).replay_verified).toBe(false);
    expect(validateMaturityDomainEvaluation(evaluateMaturityDomains({ scenario: "GOVERNANCE_VALIDATION_FAILURE" })).governance_validated).toBe(false);
    expect(validateMaturityDomainEvaluation(evaluateMaturityDomains({ scenario: "CONSTITUTIONAL_VALIDATION_FAILURE" })).constitutional_validated).toBe(false);
    expect(validateMaturityDomainEvaluation(evaluateMaturityDomains({ scenario: "AUTHORITY_BYPASS" })).authority_enforced).toBe(false);
    expect(validateMaturityDomainEvaluation(evaluateMaturityDomains({ scenario: "HIDDEN_EVALUATION_LOGIC" })).no_hidden_logic).toBe(false);
    expect(validateMaturityDomainEvaluation(evaluateMaturityDomains({ scenario: "TENANT_ISOLATION_VIOLATION" })).tenant_isolated).toBe(false);
  });

  it("publishes observability without execution authority", () => {
    const surface = buildMaturityDomainEvaluationObservabilitySurface(evaluateMaturityDomains({ scenario: "INCOMPLETE_EVIDENCE" }));

    expect(surface.final_state).toBe("MATURITY_DOMAIN_EVALUATION_FAILED");
    expect(surface.domain_count).toBe(10);
    expect(surface.metric_count).toBe(31);
    expect(surface.report_count).toBe(10);
    expect(surface.audit_count).toBe(10);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.advisory_only).toBe(true);
    expect(surface.execution_behavior_change_authorized).toBe(false);
  });
});
