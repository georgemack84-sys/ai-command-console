import { describe, expect, it } from "vitest";
import { createDecisionContext } from "@/services/decision-context-contract";
import {
  buildContextRegistryObservability,
  createContextRegistryRequest,
  getContextRegistryLedgerReplayInfrastructure,
  registerContext,
  replayContextRegistry,
} from "@/services/decision-context-registry-ledger-replay";
import { createContextIntegrityValidationRequest, validateContextIntegrityExplainability } from "@/services/decision-context-integrity-validation-explainability";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";

describe("Mission Control Phase 9.3.11 Context Registry, Ledger & Replay", () => {
  function normalizedCandidate() {
    const normalized = normalizeDecisionCandidateInput();
    if (!normalized.candidate) throw new Error("expected normalized candidate");
    return normalized.candidate;
  }

  it("registers, ledgers, persists, and packages a certified context", () => {
    const pkg = registerContext();

    expect(pkg.validation.validation_status).toBe("PASS");
    expect(pkg.validation.lifecycle_state).toBe("CERTIFIED");
    expect(pkg.registry_record.certification_state).toBe("CERTIFIED");
    expect(pkg.ledger_entries.map((entry) => entry.event_type)).toEqual([
      "CONTEXT_REGISTERED",
      "CONTEXT_VALIDATED",
      "CONTEXT_CERTIFIED",
      "CONTEXT_REPLAY_GENERATED",
      "CONTEXT_REPLAY_VERIFIED",
    ]);
    expect(pkg.repository_record.serialized_context).toContain(pkg.registry_record.context_id);
    expect(pkg.replay_package.replay_dependencies.length).toBeGreaterThan(0);
    expect(pkg.audit_trail.ledger_events).toHaveLength(pkg.ledger_entries.length);
    expect(pkg.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces identical registry packages for identical inputs", () => {
    const request = createContextRegistryRequest();
    const first = registerContext(request);
    const second = registerContext(request);

    expect(second.registry_record).toEqual(first.registry_record);
    expect(second.ledger_entries).toEqual(first.ledger_entries);
    expect(second.repository_record).toEqual(first.repository_record);
    expect(second.replay_package).toEqual(first.replay_package);
    expect(second.audit_trail).toEqual(first.audit_trail);
    expect(second.integrity_hash).toBe(first.integrity_hash);
  });

  it("preserves append-only ledger hash chaining", () => {
    const pkg = registerContext();

    expect(pkg.ledger_entries[0]?.previous_hash).toBe("GENESIS");
    for (let index = 1; index < pkg.ledger_entries.length; index += 1) {
      expect(pkg.ledger_entries[index]?.previous_hash).toBe(pkg.ledger_entries[index - 1]?.current_hash);
    }
  });

  it("fails closed for duplicate registry identity", () => {
    const first = registerContext();
    const duplicate = registerContext(createContextRegistryRequest({
      existing_registry: [first.registry_record],
    }));

    expect(duplicate.validation.validation_status).toBe("FAIL");
    expect(duplicate.validation.failure_reasons).toContain("DUPLICATE_REGISTRY_IDENTITY");
    expect(duplicate.validation.checks.registry_identity_unique).toBe(false);
  });

  it("blocks contexts that are not certified by validation", () => {
    const candidate = normalizedCandidate();
    const decision_context = createDecisionContext({
      candidate,
      domain_overrides: {
        evidence_context: { source_subsystem: "" },
      },
    });
    const validation_report = validateContextIntegrityExplainability(createContextIntegrityValidationRequest({ candidate, decision_context }));
    const pkg = registerContext(createContextRegistryRequest({ candidate, decision_context, validation_report }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain("VALIDATION_NOT_CERTIFIED");
    expect(pkg.registry_record.certification_state).toBe("NOT_CERTIFIED");
  });

  it("fails closed for cross-tenant storage", () => {
    const candidate = { ...normalizedCandidate(), replay_refs: ["replay_tenant_beta_history"] };
    const decision_context = createDecisionContext({ candidate });
    const validation_report = validateContextIntegrityExplainability(createContextIntegrityValidationRequest({ candidate, decision_context }));
    const pkg = registerContext(createContextRegistryRequest({ candidate, decision_context, validation_report }));

    expect(pkg.validation.validation_status).toBe("FAIL");
    expect(pkg.validation.failure_reasons).toContain("CROSS_TENANT_STORAGE_DETECTED");
    expect(pkg.validation.checks.tenant_isolated).toBe(false);
  });

  it("replays registry package deterministically", () => {
    const pkg = registerContext();
    const replay = replayContextRegistry(pkg);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.expected_hash);
    expect(replay.reconstructed_lifecycle_state).toBe("CERTIFIED");
    expect(replay.failures).toEqual([]);
  });

  it("publishes registry observability metrics", () => {
    const pass = registerContext();
    const duplicate = registerContext(createContextRegistryRequest({ existing_registry: [pass.registry_record] }));
    const candidate = normalizedCandidate();
    const decision_context = createDecisionContext({ candidate, domain_overrides: { evidence_context: { source_subsystem: "" } } });
    const uncertified = registerContext(createContextRegistryRequest({
      candidate,
      decision_context,
      validation_report: validateContextIntegrityExplainability(createContextIntegrityValidationRequest({ candidate, decision_context })),
    }));

    const metrics = buildContextRegistryObservability([pass, duplicate, uncertified]);

    expect(metrics.registration_attempts).toBe(3);
    expect(metrics.successful_registrations).toBe(1);
    expect(metrics.failed_registrations).toBe(2);
    expect(metrics.ledger_entries_created).toBe(15);
    expect(metrics.replay_packages_created).toBe(3);
    expect(metrics.duplicate_identity_failures).toBeGreaterThan(0);
    expect(metrics.replay_success_rate).toBe(1);
  });

  it("exposes the context registry ledger replay infrastructure", () => {
    const infrastructure = getContextRegistryLedgerReplayInfrastructure();

    expect(infrastructure.ledger_events).toContain("CONTEXT_REPLAY_VERIFIED");
    expect(infrastructure.registry_package.validation.validation_status).toBe("PASS");
    expect(infrastructure.replay.replay_valid).toBe(true);
    expect(infrastructure.observability.registration_attempts).toBe(1);
  });
});
