import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { evaluateSamApproval } from "../../services/sam/samApprovalGate.ts";
import { runSamBridge } from "../../services/sam/samBridgeController.ts";
import { clearSamAuditDeduplicationState } from "../../services/sam/samAuditDeduplication.ts";
import { clearSamIdempotencyStore } from "../../services/sam/samIdempotencyStore.ts";
import { clearSamChaosFailureInjection, configureSamChaosFailureInjection } from "../../services/sam/chaos/samFailureInjection.ts";
import { runSamChaosScenario } from "../../services/sam/chaos/samChaosRunner.ts";

beforeEach(() => {
  clearSamChaosFailureInjection();
  clearSamIdempotencyStore();
  clearSamAuditDeduplicationState();
  process.env.SAM_ENABLED = "true";
  process.env.SAM_DRY_RUN = "true";
  process.env.SAM_REQUIRE_APPROVAL = "true";
  process.env.SAM_IDEMPOTENCY_ENABLED = "true";
  process.env.SAM_RETRY_SAFETY_ENABLED = "true";
  process.env.SAM_AUDIT_DEDUPLICATION_ENABLED = "true";
  process.env.SAM_DURABLE_IDEMPOTENCY_ENABLED = "false";
});

afterEach(() => {
  delete process.env.SAM_ENABLED;
  delete process.env.SAM_DRY_RUN;
  delete process.env.SAM_REQUIRE_APPROVAL;
  delete process.env.SAM_IDEMPOTENCY_ENABLED;
  delete process.env.SAM_RETRY_SAFETY_ENABLED;
  delete process.env.SAM_AUDIT_DEDUPLICATION_ENABLED;
  delete process.env.SAM_DURABLE_IDEMPOTENCY_ENABLED;
});

function baseRequest(overrides: Record<string, unknown> = {}) {
  return {
    type: "DUPLICATE_REPLAY" as const,
    executionId: "demo-chaos-exec-1",
    attemptId: "attempt-1",
    deterministicSeed: "seed-1",
    dryRun: true as const,
    ...overrides,
  };
}

describe("sam chaos runner", () => {
  it("rejects unknown scenario types", async () => {
    const result = await runSamChaosScenario(baseRequest({ type: "NOT_REAL" }) as any);
    expect(result.passed).toBe(false);
    expect(result.findings).toContain("SAM_CHAOS_UNSUPPORTED_FAILURE_TYPE");
  });

  it("requires dryRun: true", async () => {
    const result = await runSamChaosScenario(baseRequest({ dryRun: false }) as any);
    expect(result.passed).toBe(false);
    expect(result.findings).toContain("SAM_CHAOS_INVALID_SCENARIO");
  });

  it("requires executionId", async () => {
    const result = await runSamChaosScenario(baseRequest({ executionId: "" }) as any);
    expect(result.passed).toBe(false);
    expect(result.findings).toContain("SAM_CHAOS_INVALID_SCENARIO");
  });

  it("requires attemptId", async () => {
    const result = await runSamChaosScenario(baseRequest({ attemptId: "" }) as any);
    expect(result.passed).toBe(false);
    expect(result.findings).toContain("SAM_CHAOS_INVALID_SCENARIO");
  });

  it("requires deterministicSeed", async () => {
    const result = await runSamChaosScenario(baseRequest({ deterministicSeed: "" }) as any);
    expect(result.passed).toBe(false);
    expect(result.findings).toContain("SAM_CHAOS_INVALID_SCENARIO");
  });

  it("approval remains required during chaos", async () => {
    configureSamChaosFailureInjection({ deterministicSeed: "seed-approval" });
    const result = evaluateSamApproval({
      actionType: "recover_execution",
      requireApproval: true,
    });

    expect(result.granted).toBe(false);
    expect(result.reason).toBe("SAM_APPROVAL_REQUIRED");
  });

  it("denied approval still blocks during chaos", async () => {
    configureSamChaosFailureInjection({ deterministicSeed: "seed-denied" });
    const result = evaluateSamApproval({
      actionType: "recover_execution",
      requireApproval: true,
      approval: {
        status: "denied",
        reason: "not approved",
      },
    });

    expect(result.denied).toBe(true);
    expect(result.reason).toBe("SAM_APPROVAL_DENIED");
  });

  it("real execution remains forbidden", async () => {
    configureSamChaosFailureInjection({ deterministicSeed: "seed-real" });
    const result = await runSamBridge({
      proposal: {
        proposalId: "proposal-real",
        executionId: "demo-chaos-exec-real",
        attemptId: "attempt-real",
        actionType: "recover_execution",
        requestedBy: "ai",
        reason: "chaos real",
        riskLevel: "high",
        confidence: 0.9,
        params: { realExecution: true },
        createdAt: "2026-05-07T00:00:00.000Z",
      },
      approval: {
        status: "granted",
        approvedBy: "operator_1",
      },
    });

    expect(result.blocked).toBe(true);
    expect(result.errors.some((error) => error.code === "SAM_REAL_EXECUTION_FORBIDDEN")).toBe(true);
  });
});
