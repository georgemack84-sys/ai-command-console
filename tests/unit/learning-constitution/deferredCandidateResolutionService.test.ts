import { describe, expect, it, vi } from "vitest";

import { DeferredCandidateLifecycleService, DeferredCandidateResolutionService, InMemoryDeferredCandidateRegistry, InMemoryDeferredCandidateResolutionLedger } from "@/services/learning-constitution";
import type { DeferredCandidateResolutionEvent, GateDecision } from "@/types/learning-constitution";

const deferred: GateDecision = { evaluationId: "evaluation-1", candidateId: "candidate-1", outcome: "DEFER", reasonCodes: ["APPROVAL_REQUIRED"], checks: [], inputFingerprint: "fingerprint", context: { gateVersion: "9", constitutionVersion: "1", taxonomyVersion: "1", authorityPolicyVersion: "1", validationPolicyVersion: "1", conflictEngineVersion: "8", registryVersion: "1", learningIntent: "EXPLICIT", decisionActorId: "user:owner" }, authorityEffect: "UNCHANGED", executionPermissionGranted: false };
const resolution: DeferredCandidateResolutionEvent = { eventId: "resolution-1", candidateId: "candidate-1", kind: "APPROVAL", actorId: "user:manager", summary: "Approved for re-evaluation.", evidenceRefs: ["approval:1"], occurredAt: "2026-08-31T00:01:00.000Z" };

describe("DeferredCandidateResolutionService", () => {
  it("records approval as provenance and re-evaluates instead of promoting directly", async () => {
    const registry = new InMemoryDeferredCandidateRegistry();
    const promotion = { promote: vi.fn().mockResolvedValue({ status: "DEFERRED", gateDecision: { ...deferred, evaluationId: "evaluation-2" }, persistenceEffect: "NONE" }) };
    const lifecycle = new DeferredCandidateLifecycleService({ registry, promotion });
    await lifecycle.defer(deferred);
    const resolutionLedger = new InMemoryDeferredCandidateResolutionLedger();
    const build = vi.fn().mockResolvedValue({ gateRequest: { candidate: { candidateId: "candidate-1" } }, admission: {} });
    const service = new DeferredCandidateResolutionService({ registry, resolutionLedger, reevaluationInputProvider: { build }, lifecycle });

    await expect(service.resolve("deferred:candidate-1", resolution)).resolves.toMatchObject({ resolution, reevaluation: { status: "PENDING" }, authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect(await resolutionLedger.findByCandidateId("candidate-1")).toEqual([resolution]);
    expect(build).toHaveBeenCalledWith(expect.objectContaining({ resolution }));
    expect(promotion.promote).toHaveBeenCalledOnce();
  });

  it("rejects a resolution for a missing or non-pending candidate without evaluating", async () => {
    const registry = new InMemoryDeferredCandidateRegistry();
    const lifecycle = new DeferredCandidateLifecycleService({ registry, promotion: { promote: async () => { throw new Error("must not evaluate"); } } });
    const service = new DeferredCandidateResolutionService({ registry, resolutionLedger: new InMemoryDeferredCandidateResolutionLedger(), reevaluationInputProvider: { build: async () => { throw new Error("must not build"); } }, lifecycle });

    await expect(service.resolve("deferred:missing", resolution)).resolves.toBeUndefined();
  });
});
