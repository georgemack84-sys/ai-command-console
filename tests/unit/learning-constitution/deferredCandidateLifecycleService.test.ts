import { describe, expect, it, vi } from "vitest";

import { DeferredCandidateLifecycleService, InMemoryDeferredCandidateRegistry } from "@/services/learning-constitution";
import type { DeferredCandidateReevaluationInput, GateDecision } from "@/types/learning-constitution";

const deferredDecision: GateDecision = { evaluationId: "evaluation-1", candidateId: "candidate-1", outcome: "DEFER", reasonCodes: ["VALIDATION_INCOMPLETE"], checks: [], inputFingerprint: "fingerprint", context: { gateVersion: "9", constitutionVersion: "1", taxonomyVersion: "1", authorityPolicyVersion: "1", validationPolicyVersion: "1", conflictEngineVersion: "8", registryVersion: "1", learningIntent: "EXPLICIT", decisionActorId: "user:owner" }, authorityEffect: "UNCHANGED", executionPermissionGranted: false };
const reevaluationInput = { gateRequest: { candidate: { candidateId: "candidate-1" } }, admission: {} } as DeferredCandidateReevaluationInput;

describe("DeferredCandidateLifecycleService", () => {
  it("does not allow a deferred candidate to become durable without a fresh promotion evaluation", async () => {
    const registry = new InMemoryDeferredCandidateRegistry();
    const promote = vi.fn().mockResolvedValue({ status: "COMMITTED", gateDecision: { ...deferredDecision, evaluationId: "evaluation-2", outcome: "ACCEPT", reasonCodes: [] }, persistenceEffect: "CREATED" });
    const service = new DeferredCandidateLifecycleService({ registry, promotion: { promote }, now: () => "2026-08-31T00:00:00.000Z" });
    const deferred = await service.defer(deferredDecision);

    expect(deferred).toMatchObject({ status: "PENDING", reasonCodes: ["VALIDATION_INCOMPLETE"] });
    await expect(service.reevaluate(deferred!.deferredCandidateId, reevaluationInput)).resolves.toMatchObject({ status: "COMMITTED", record: { lastEvaluationId: "evaluation-2", status: "COMMITTED" } });
    expect(promote).toHaveBeenCalledWith(reevaluationInput);
  });

  it("keeps the candidate pending when its new evaluation remains deferred", async () => {
    const registry = new InMemoryDeferredCandidateRegistry();
    const service = new DeferredCandidateLifecycleService({ registry, promotion: { promote: async () => ({ status: "DEFERRED", gateDecision: { ...deferredDecision, evaluationId: "evaluation-2" }, persistenceEffect: "NONE" }) } });
    const deferred = await service.defer(deferredDecision);

    await expect(service.reevaluate(deferred!.deferredCandidateId, reevaluationInput)).resolves.toMatchObject({ status: "PENDING", record: { status: "PENDING" } });
  });
});
