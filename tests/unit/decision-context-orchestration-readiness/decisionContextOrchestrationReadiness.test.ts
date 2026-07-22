import { describe, expect, it } from "vitest";
import {
  assessOrchestrationReadiness,
  buildOrchestrationReadinessObservability,
  createOrchestrationReadinessRequest,
  getDecisionContextOrchestrationReadinessFramework,
  replayOrchestrationReadiness,
} from "@/services/decision-context-orchestration-readiness";
import { createContextRegistryRequest, registerContext } from "@/services/decision-context-registry-ledger-replay";
import { createContextIntegrityValidationRequest, validateContextIntegrityExplainability } from "@/services/decision-context-integrity-validation-explainability";
import { createDecisionContext } from "@/services/decision-context-contract";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";

describe("Mission Control Phase 9.3.12 Decision Context Integration & Orchestration Readiness", () => {
  function normalizedCandidate() {
    const normalized = normalizeDecisionCandidateInput();
    if (!normalized.candidate) throw new Error("expected normalized candidate");
    return normalized.candidate;
  }

  it("certifies orchestration readiness for a registered context", () => {
    const pkg = assessOrchestrationReadiness();

    expect(pkg.validation.validation_status).toBe("PASS");
    expect(pkg.validation.validation_state).toBe("PASSED");
    expect(pkg.readiness.readiness_state).toBe("READY");
    expect(pkg.readiness.orchestration_eligible).toBe(true);
    expect(pkg.readiness.readiness_score).toBe(1);
    expect(pkg.integration.downstream_interfaces).toContain("decision_ranking_engine");
    expect(pkg.downstream_registry.every((item) => item.compatibility_status === "COMPATIBLE")).toBe(true);
    expect(pkg.orchestration_entry_package.self_contained).toBe(true);
    expect(pkg.orchestration_entry_package.advisory_only).toBe(true);
    expect(pkg.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces identical readiness packages for identical inputs", () => {
    const request = createOrchestrationReadinessRequest();
    const first = assessOrchestrationReadiness(request);
    const second = assessOrchestrationReadiness(request);

    expect(second.readiness).toEqual(first.readiness);
    expect(second.integration).toEqual(first.integration);
    expect(second.downstream_registry).toEqual(first.downstream_registry);
    expect(second.readiness_report).toEqual(first.readiness_report);
    expect(second.integrity_hash).toBe(first.integrity_hash);
  });

  it("fails closed when an interface is incompatible", () => {
    const pkg = assessOrchestrationReadiness(createOrchestrationReadinessRequest({
      interface_overrides: { replay_engine: "INCOMPATIBLE" },
    }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_INTERFACE");
    expect(pkg.validation.failure_reasons).toContain("INTERFACE_INCOMPATIBLE");
    expect(pkg.readiness.readiness_state).toBe("NOT_READY");
    expect(pkg.readiness.orchestration_eligible).toBe(false);
    expect(pkg.readiness_report.orchestration_decision).toBe("BLOCK_ORCHESTRATION_ENTRY");
  });

  it("blocks contexts that were not certified upstream", () => {
    const candidate = normalizedCandidate();
    const decision_context = createDecisionContext({
      candidate,
      domain_overrides: {
        evidence_context: { source_subsystem: "" },
      },
    });
    const validation_report = validateContextIntegrityExplainability(createContextIntegrityValidationRequest({ candidate, decision_context }));
    const registry_package = registerContext(createContextRegistryRequest({ candidate, decision_context, validation_report }));
    const pkg = assessOrchestrationReadiness(createOrchestrationReadinessRequest({ candidate, registry_package }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain("CONTEXT_INCOMPLETE");
    expect(pkg.validation.failure_reasons).toContain("CERTIFICATION_INCOMPLETE");
    expect(pkg.readiness.readiness_state).toBe("NOT_READY");
    expect(pkg.orchestration_entry_package.self_contained).toBe(false);
  });

  it("blocks cross-tenant integration", () => {
    const candidate = { ...normalizedCandidate(), replay_refs: ["replay_tenant_beta_history"] };
    const registry_package = registerContext(createContextRegistryRequest({ candidate }));
    const pkg = assessOrchestrationReadiness(createOrchestrationReadinessRequest({ candidate, registry_package }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.validation_state).toBe("FAILED_ISOLATION");
    expect(pkg.validation.failure_reasons).toContain("CROSS_TENANT_INTEGRATION");
    expect(pkg.readiness.readiness_state).toBe("BLOCKED");
  });

  it("replays orchestration readiness deterministically", () => {
    const pkg = assessOrchestrationReadiness();
    const replay = replayOrchestrationReadiness(pkg);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_state).toBe("READY");
    expect(replay.failures).toEqual([]);
  });

  it("publishes readiness observability metrics", () => {
    const ready = assessOrchestrationReadiness();
    const incompatible = assessOrchestrationReadiness(createOrchestrationReadinessRequest({
      interface_overrides: { replay_engine: "INCOMPATIBLE" },
    }));
    const crossTenantCandidate = { ...normalizedCandidate(), replay_refs: ["replay_tenant_beta_history"] };
    const crossTenant = assessOrchestrationReadiness(createOrchestrationReadinessRequest({
      candidate: crossTenantCandidate,
      registry_package: registerContext(createContextRegistryRequest({ candidate: crossTenantCandidate })),
    }));

    const metrics = buildOrchestrationReadinessObservability([ready, incompatible, crossTenant]);

    expect(metrics.readiness_attempts).toBe(3);
    expect(metrics.ready_count).toBe(1);
    expect(metrics.blocked_count).toBe(2);
    expect(metrics.interface_failures).toBeGreaterThan(0);
    expect(metrics.isolation_failures).toBeGreaterThan(0);
    expect(metrics.average_readiness_score).toBeGreaterThan(0);
    expect(metrics.replay_success_rate).toBe(1);
  });

  it("exposes the decision context orchestration readiness framework", () => {
    const framework = getDecisionContextOrchestrationReadinessFramework();

    expect(framework.downstream_interfaces).toContain("certification_framework");
    expect(framework.readiness_package.validation.validation_status).toBe("PASS");
    expect(framework.replay.replay_valid).toBe(true);
    expect(framework.observability.readiness_attempts).toBe(1);
  });
});
