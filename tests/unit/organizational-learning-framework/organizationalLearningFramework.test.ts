import { describe, expect, it } from "vitest";

import {
  getOrganizationalLearningContract,
  replayOrganizationalLearning,
  runOrganizationalLearning,
  validateOrganizationalLearning,
} from "../../../services/organizational-learning-framework";

describe("organizational learning framework", () => {
  it("runs deterministic certified organizational learning", () => {
    const first = runOrganizationalLearning();
    const second = runOrganizationalLearning();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.approved_for_organizational_use).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateOrganizationalLearning(first).valid).toBe(true);
    expect(replayOrganizationalLearning(first)).toBe(true);
  });

  it("preserves advisory learning and human-governed boundaries", () => {
    const bundle = getOrganizationalLearningContract();

    expect(bundle.doctrine.advisory_only).toBe(true);
    expect(bundle.doctrine.automatic_policy_changes_supported).toBe(false);
    expect(bundle.doctrine.automatic_execution_supported).toBe(false);
    expect(bundle.doctrine.cross_tenant_learning_supported).toBe(false);
  });

  it("qualifies lessons across all learning categories", () => {
    const result = runOrganizationalLearning();

    expect(result.retrieval_certified).toBe(true);
    expect(result.lessons).toHaveLength(6);
    expect(result.lessons.every((lesson) => lesson.evidence_refs.length >= 3 && lesson.confidence_score >= 0.8)).toBe(true);
    expect(result.lessons.every((lesson) => lesson.replay_validated && lesson.governance_approved && lesson.constitutional_valid)).toBe(true);
  });

  it("generates reproducible advisory recommendations and trends", () => {
    const result = runOrganizationalLearning();

    expect(result.recommendations).toHaveLength(6);
    expect(result.recommendations.every((rec) => rec.reproducible && rec.advisory_only && rec.auto_execute === false)).toBe(true);
    expect(result.trends).toHaveLength(6);
    expect(result.trends.every((trend) => trend.reproducible)).toBe(true);
  });

  it("tracks strategic evolution and deterministic institutional metrics", () => {
    const result = runOrganizationalLearning();

    expect(result.strategic_evolution.traceable).toBe(true);
    expect(result.strategic_evolution.evolution_confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.metrics.deterministic).toBe(true);
    expect(result.metrics.risk_reduction).toBeGreaterThanOrEqual(0.1);
    expect(result.metrics.confidence_growth).toBeGreaterThanOrEqual(0.1);
  });

  it("runs the learning certification suite and append-only ledger", () => {
    const result = runOrganizationalLearning();

    expect(result.certification.tests).toHaveLength(25);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
    expect(result.ledger).toHaveLength(8);
    expect(result.ledger.every((entry, index) => entry.append_only && entry.sequence === index + 1)).toBe(true);
  });

  it("fails closed on governance, replay, tenant, evidence, and authority violations", () => {
    for (const scenario of ["POLICY_NONCOMPLIANCE", "CONSTITUTIONAL_VIOLATION", "TENANT_ISOLATION_BREACH", "REPLAY_DIVERGENCE", "EVIDENCE_INSUFFICIENT", "AUTHORITY_BOUNDARY_VIOLATION"] as const) {
      const result = runOrganizationalLearning({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.approved_for_organizational_use).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateOrganizationalLearning(result).valid).toBe(false);
    }
  });
});
