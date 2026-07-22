import { describe, expect, it } from "vitest";
import {
  buildEvidenceDependencyObservability,
  createEvidenceDependencyContextRequest,
  getEvidenceDependencyContextResolver,
  replayEvidenceDependencyContext,
  resolveEvidenceDependencyContext,
} from "@/services/decision-evidence-dependency-context";
import { createDecisionContext, validateDecisionContext } from "@/services/decision-context-contract";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";

describe("Mission Control Phase 9.3.4 Evidence & Dependency Context Resolver", () => {
  it("resolves certified evidence and dependency context deterministically", () => {
    const pkg = resolveEvidenceDependencyContext();

    expect(pkg.validation.validation_status).toBe("PASS");
    expect(pkg.validation.validation_state).toBe("PASSED");
    expect(pkg.evidence_context.primary_evidence).toHaveLength(1);
    expect(pkg.evidence_context.supporting_evidence.length).toBeGreaterThan(0);
    expect(pkg.evidence_context.observations.length).toBeGreaterThan(0);
    expect(pkg.evidence_context.findings.length).toBeGreaterThan(0);
    expect(pkg.evidence_context.evidence_quality).toBe("CERTIFIED");
    expect(pkg.dependency_context.dependency_graph.acyclic).toBe(true);
    expect(pkg.dependency_context.dependency_status).toBe("WAITING");
    expect(pkg.evidence_domain.domain_name).toBe("evidence_context");
    expect(pkg.dependency_domain.domain_name).toBe("dependency_context");
    expect(pkg.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("preserves conflicting evidence instead of suppressing it", () => {
    const pkg = resolveEvidenceDependencyContext();

    expect(pkg.evidence_context.conflicting_evidence).toHaveLength(1);
    expect(pkg.evidence_context.explainability.conflicting_evidence).toEqual(pkg.evidence_context.conflicting_evidence.map((record) => record.evidence_id));
    expect(pkg.evidence_domain.governance_rationale).toContain("conflicting evidence");
  });

  it("produces identical packages for identical inputs", () => {
    const request = createEvidenceDependencyContextRequest();
    const first = resolveEvidenceDependencyContext(request);
    const second = resolveEvidenceDependencyContext(request);

    expect(second.evidence_context).toEqual(first.evidence_context);
    expect(second.dependency_context).toEqual(first.dependency_context);
    expect(second.lineage_graph).toEqual(first.lineage_graph);
    expect(second.integrity_hash).toBe(first.integrity_hash);
  });

  it("can patch the 9.3.1 evidence and dependency domains", () => {
    const normalized = normalizeDecisionCandidateInput();
    const pkg = resolveEvidenceDependencyContext(createEvidenceDependencyContextRequest({ candidate: normalized.candidate }));
    const context = createDecisionContext({
      candidate: normalized.candidate,
      domain_overrides: {
        evidence_context: pkg.evidence_domain,
        dependency_context: pkg.dependency_domain,
      },
    });

    expect(context.evidence_context.originating_record).toBe(pkg.evidence_domain.originating_record);
    expect(context.dependency_context.originating_record).toBe(pkg.dependency_domain.originating_record);
    expect(validateDecisionContext(context).validation_state).toBe("VALID");
  });

  it("fails closed when primary evidence is missing", () => {
    const normalized = normalizeDecisionCandidateInput();
    const candidate = normalized.candidate ? { ...normalized.candidate, evidence_refs: ["evidence_missing_primary"] } : undefined;
    const pkg = resolveEvidenceDependencyContext(createEvidenceDependencyContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_EVIDENCE");
    expect(pkg.validation.failure_reasons).toContain("PRIMARY_EVIDENCE_MISSING");
    expect(pkg.validation.checks.primary_evidence_exists).toBe(false);
  });

  it("fails closed for cross-tenant evidence", () => {
    const normalized = normalizeDecisionCandidateInput();
    const candidate = normalized.candidate ? { ...normalized.candidate, evidence_refs: ["evidence_tenant_beta_mission_phase_9_decision_orchestration_001"] } : undefined;
    const pkg = resolveEvidenceDependencyContext(createEvidenceDependencyContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_ISOLATION");
    expect(pkg.validation.failure_reasons).toContain("CROSS_TENANT_EVIDENCE");
    expect(pkg.validation.checks.tenant_isolated).toBe(false);
  });

  it("detects circular dependency graphs", () => {
    const normalized = normalizeDecisionCandidateInput();
    const candidate = normalized.candidate ? { ...normalized.candidate, candidate_id: "candidate_circular_dependency" } : undefined;
    const pkg = resolveEvidenceDependencyContext(createEvidenceDependencyContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_DEPENDENCY");
    expect(pkg.validation.failure_reasons).toContain("CIRCULAR_DEPENDENCY_DETECTED");
    expect(pkg.dependency_context.dependency_graph.acyclic).toBe(false);
    expect(pkg.dependency_context.dependency_status).toBe("CIRCULAR");
  });

  it("builds immutable evidence lineage graph", () => {
    const pkg = resolveEvidenceDependencyContext();

    expect(pkg.lineage_graph.graph_id).toContain(pkg.candidate_id);
    expect(pkg.lineage_graph.evidence_origins.length).toBeGreaterThan(0);
    expect(pkg.lineage_graph.transformations.length).toBeGreaterThan(0);
    expect(pkg.lineage_graph.referencing_decisions).toEqual([pkg.candidate_id]);
    expect(pkg.lineage_graph.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("replays evidence and dependency context deterministically", () => {
    const pkg = resolveEvidenceDependencyContext();
    const replay = replayEvidenceDependencyContext(pkg);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("PASSED");
    expect(replay.failures).toEqual([]);
  });

  it("publishes resolver observability metrics", () => {
    const pass = resolveEvidenceDependencyContext();
    const missing = resolveEvidenceDependencyContext(createEvidenceDependencyContextRequest({
      candidate: normalizeDecisionCandidateInput().candidate ? { ...normalizeDecisionCandidateInput().candidate!, evidence_refs: ["missing"] } : undefined,
    }));
    const circular = resolveEvidenceDependencyContext(createEvidenceDependencyContextRequest({
      candidate: normalizeDecisionCandidateInput().candidate ? { ...normalizeDecisionCandidateInput().candidate!, candidate_id: "candidate_circular_dependency" } : undefined,
    }));

    const metrics = buildEvidenceDependencyObservability([pass, missing, circular]);

    expect(metrics.resolution_attempts).toBe(3);
    expect(metrics.successful_resolutions).toBe(1);
    expect(metrics.failed_resolutions).toBe(2);
    expect(metrics.evidence_failures).toBeGreaterThan(0);
    expect(metrics.dependency_failures).toBeGreaterThan(0);
    expect(metrics.conflict_count).toBeGreaterThan(0);
    expect(metrics.replay_success_rate).toBe(1);
  });

  it("exposes the evidence dependency resolver package", () => {
    const resolver = getEvidenceDependencyContextResolver();

    expect(resolver.resolution_order).toContain("GRAPH_BUILT");
    expect(resolver.context_package.validation.validation_status).toBe("PASS");
    expect(resolver.replay.replay_valid).toBe(true);
    expect(resolver.observability.resolution_attempts).toBe(1);
  });
});
