import { describe, expect, it } from "vitest";
import { createDecisionContext, validateDecisionContext } from "@/services/decision-context-contract";
import {
  buildHistoricalReplayObservability,
  createHistoricalReplayContextRequest,
  getHistoricalReplayContextResolver,
  replayHistoricalReplayContext,
  resolveHistoricalReplayContext,
} from "@/services/decision-historical-replay-context";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";

describe("Mission Control Phase 9.3.8 Historical Lineage & Replay Context Resolver", () => {
  function normalizedCandidate() {
    const normalized = normalizeDecisionCandidateInput();
    if (!normalized.candidate) throw new Error("expected normalized candidate");
    return normalized.candidate;
  }

  it("resolves deterministic historical and replay context", () => {
    const pkg = resolveHistoricalReplayContext();

    expect(pkg.validation.validation_status).toBe("PASS");
    expect(pkg.validation.validation_state).toBe("PASSED");
    expect(pkg.historical_context.historical_decisions.length).toBeGreaterThan(0);
    expect(pkg.historical_context.previous_outcomes.length).toBe(pkg.historical_context.historical_decisions.length);
    expect(pkg.historical_context.certification_history.length).toBe(pkg.historical_context.historical_decisions.length);
    expect(pkg.historical_context.prior_approvals).toContain("decision_phase_9_context_resolver_chain");
    expect(pkg.replay_context.replay_availability).toBe("AVAILABLE");
    expect(pkg.replay_context.replay_integrity).toBe("VALID");
    expect(pkg.lineage_graph.root_decision_refs).toContain("decision_phase_9_root_context_foundation");
    expect(pkg.lineage_graph.parent_decision_refs).toContain("decision_phase_9_root_context_foundation");
    expect(pkg.historical_domain.domain_name).toBe("historical_context");
    expect(pkg.replay_domain.domain_name).toBe("replay_context");
    expect(pkg.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces identical packages for identical inputs", () => {
    const request = createHistoricalReplayContextRequest();
    const first = resolveHistoricalReplayContext(request);
    const second = resolveHistoricalReplayContext(request);

    expect(second.historical_context).toEqual(first.historical_context);
    expect(second.replay_context).toEqual(first.replay_context);
    expect(second.lineage_graph).toEqual(first.lineage_graph);
    expect(second.integrity_hash).toBe(first.integrity_hash);
  });

  it("explains linked decisions, outcomes, replay artifacts, and certifications", () => {
    const pkg = resolveHistoricalReplayContext();

    expect(pkg.historical_context.explainability.linked_decision_rationale[0]).toContain("decision_phase_9");
    expect(pkg.historical_context.explainability.outcome_summary[0]).toContain("VALID");
    expect(pkg.replay_context.explainability.replay_availability_rationale).toContain("AVAILABLE");
    expect(pkg.replay_context.explainability.certification_summary.length).toBeGreaterThan(0);
  });

  it("can patch the 9.3.1 historical and replay domains", () => {
    const candidate = normalizedCandidate();
    const pkg = resolveHistoricalReplayContext(createHistoricalReplayContextRequest({ candidate }));
    const context = createDecisionContext({
      candidate,
      domain_overrides: {
        historical_context: pkg.historical_domain,
        replay_context: pkg.replay_domain,
      },
    });

    expect(context.historical_context.originating_record).toBe(pkg.historical_domain.originating_record);
    expect(context.replay_context.originating_record).toBe(pkg.replay_domain.originating_record);
    expect(validateDecisionContext(context).validation_state).toBe("VALID");
  });

  it("fails closed when historical decisions cannot be resolved", () => {
    const candidate = { ...normalizedCandidate(), mission_id: "mission_without_history" };
    const pkg = resolveHistoricalReplayContext(createHistoricalReplayContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain("HISTORICAL_DECISIONS_UNRESOLVED");
    expect(pkg.validation.checks.historical_decisions_resolved).toBe(false);
    expect(pkg.historical_domain.status).toBe("UNAVAILABLE");
  });

  it("fails closed when replay artifacts are unavailable", () => {
    const candidate = { ...normalizedCandidate(), replay_refs: ["missing_replay_reference"] };
    const pkg = resolveHistoricalReplayContext(createHistoricalReplayContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain("REPLAY_ARTIFACTS_UNAVAILABLE");
    expect(pkg.validation.checks.replay_artifacts_available).toBe(false);
    expect(pkg.replay_context.replay_availability).toBe("PARTIAL");
  });

  it("fails closed when lineage graph contains a cycle", () => {
    const candidate = { ...normalizedCandidate(), candidate_id: "candidate_lineage_cycle" };
    const pkg = resolveHistoricalReplayContext(createHistoricalReplayContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_LINEAGE");
    expect(pkg.validation.failure_reasons).toContain("LINEAGE_GRAPH_CYCLIC");
    expect(pkg.validation.checks.lineage_graph_acyclic).toBe(false);
  });

  it("fails closed for cross-tenant lineage", () => {
    const candidate = { ...normalizedCandidate(), replay_refs: ["replay_tenant_beta_history"] };
    const pkg = resolveHistoricalReplayContext(createHistoricalReplayContextRequest({ candidate }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_ISOLATION");
    expect(pkg.validation.failure_reasons).toContain("CROSS_TENANT_LINEAGE");
    expect(pkg.validation.checks.tenant_boundaries_preserved).toBe(false);
  });

  it("replays historical and replay context deterministically", () => {
    const pkg = resolveHistoricalReplayContext();
    const replay = replayHistoricalReplayContext(pkg);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("PASSED");
    expect(replay.failures).toEqual([]);
  });

  it("publishes resolver observability metrics", () => {
    const pass = resolveHistoricalReplayContext();
    const noHistory = resolveHistoricalReplayContext(createHistoricalReplayContextRequest({
      candidate: { ...normalizedCandidate(), mission_id: "mission_without_history" },
    }));
    const cycle = resolveHistoricalReplayContext(createHistoricalReplayContextRequest({
      candidate: { ...normalizedCandidate(), candidate_id: "candidate_lineage_cycle" },
    }));

    const metrics = buildHistoricalReplayObservability([pass, noHistory, cycle]);

    expect(metrics.resolution_attempts).toBe(3);
    expect(metrics.successful_resolutions).toBe(1);
    expect(metrics.failed_resolutions).toBe(2);
    expect(metrics.historical_failures).toBeGreaterThan(0);
    expect(metrics.lineage_failures).toBeGreaterThan(0);
    expect(metrics.average_history_depth).toBeGreaterThan(0);
    expect(metrics.replay_success_rate).toBe(1);
  });

  it("exposes the historical replay resolver package", () => {
    const resolver = getHistoricalReplayContextResolver();

    expect(resolver.resolution_order).toContain("LINEAGE_GRAPH_BUILT");
    expect(resolver.context_package.validation.validation_status).toBe("PASS");
    expect(resolver.replay.replay_valid).toBe(true);
    expect(resolver.observability.resolution_attempts).toBe(1);
  });
});
