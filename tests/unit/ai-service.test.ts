import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __clearAiSummaryBudgetForTests,
  __setAiServiceTestClient,
  __setAiServiceTestConfig,
  generateStructuredSummary,
  readAiSummaryBudgetSnapshot,
} from "@/src/server/services/ai-service";
import { __clearRuntimeDiagnosticsForTests } from "@/src/server/observability/runtime-diagnostics";
import { readAiSummaryDiagnostics } from "@/src/server/services/ai-service";

describe("ai service", () => {
  afterEach(() => {
    __setAiServiceTestClient(null);
    __setAiServiceTestConfig(null);
    __clearAiSummaryBudgetForTests();
    __clearRuntimeDiagnosticsForTests();
  });

  it("falls back to a deterministic mock summary without an API key", async () => {
    const summary = await generateStructuredSummary({
      workspaceName: "Pulse Workspace",
      summaryType: "triage-brief",
      focus: "Morning Triage for Pulse Workspace",
      bulletPoints: ["Release review is the top blocker.", "Two market signals need follow-up."],
    });

    expect(summary.provider).toBe("mock");
    expect(summary.summary).toMatch(/Morning Triage/i);
    expect(summary.bullets.length).toBeGreaterThan(0);
    expect(summary.fallbackReason).toBe("provider_unavailable");
    expect(summary.promptVersion).toMatch(/^2026-04-06/);
    expect(summary.traceId).toMatch(/^ai_/);
    expect(readAiSummaryDiagnostics(1)[0]?.traceId).toBe(summary.traceId);
  });

  it("supports forcing mock mode through provider policy", async () => {
    const create = vi.fn();
    __setAiServiceTestClient({
      responses: { create },
    } as never);
    __setAiServiceTestConfig({
      providerMode: "mock",
      timeoutMs: 8_000,
      maxAttempts: 2,
      allowMockFallback: true,
      dailyBudgetUsd: 1,
      estimatedCostPerRunUsd: 0.02,
      evaluationsEnabled: true,
    });

    const summary = await generateStructuredSummary({
      workspaceName: "Pulse Workspace",
      summaryType: "workspace-insight",
      focus: "Provider policy check",
      bulletPoints: ["Use deterministic mock output for this test."],
    });

    expect(create).not.toHaveBeenCalled();
    expect(summary.provider).toBe("mock");
    expect(summary.fallbackReason).toBe("provider_mode_mock");
    expect(readAiSummaryDiagnostics(1)[0]?.message).toMatch(/forced mock/i);
  });

  it("records an explicit diagnostic when openai mode is required but unavailable", async () => {
    __setAiServiceTestConfig({
      providerMode: "openai",
      timeoutMs: 8_000,
      maxAttempts: 2,
      allowMockFallback: true,
      dailyBudgetUsd: 1,
      estimatedCostPerRunUsd: 0.02,
      evaluationsEnabled: true,
    });

    const summary = await generateStructuredSummary({
      workspaceName: "Pulse Workspace",
      summaryType: "triage-brief",
      focus: "Strict provider policy",
      bulletPoints: ["The OpenAI provider is intentionally unavailable in this test."],
    });

    expect(summary.provider).toBe("mock");
    expect(summary.fallbackReason).toBe("provider_required_unavailable");
    expect(readAiSummaryDiagnostics(1)[0]?.level).toBe("error");
    expect(readAiSummaryDiagnostics(1)[0]?.message).toMatch(/required but unavailable/i);
  });

  it("retries transient AI failures before succeeding", async () => {
    const create = vi
      .fn()
      .mockRejectedValueOnce(new Error("rate limit reached"))
      .mockResolvedValueOnce({
        output_text: "Primary lane needs intervention.\n- Clear the approval backlog.\n- Escalate the EU queue.\n- Review the release blocker.",
      });

    __setAiServiceTestClient({
      responses: { create },
    } as never);

    const summary = await generateStructuredSummary({
      workspaceName: "Pulse Workspace",
      summaryType: "workspace-insight",
      focus: "Approval pressure",
      bulletPoints: ["Approval queue is slow.", "EU escalations are rising."],
    });

    expect(create).toHaveBeenCalledTimes(2);
    expect(summary.provider).toBe("openai");
    expect(summary.attempts).toBe(2);
    expect(summary.fallbackReason).toBeNull();
    expect(summary.summary).toMatch(/Primary lane/i);
    expect(summary.traceId).toMatch(/^ai_/);

    const diagnostics = readAiSummaryDiagnostics(5);
    expect(diagnostics.every((entry) => entry.traceId === summary.traceId)).toBe(true);
    expect(diagnostics.some((entry) => entry.message.includes("retrying"))).toBe(true);
    expect(diagnostics.some((entry) => entry.message.includes("generated successfully"))).toBe(true);
  });

  it("falls back with a reason when the AI response is empty", async () => {
    const create = vi.fn().mockResolvedValue({ output_text: "" });

    __setAiServiceTestClient({
      responses: { create },
    } as never);

    const summary = await generateStructuredSummary({
      workspaceName: "Pulse Workspace",
      summaryType: "triage-brief",
      focus: "Morning Triage for Pulse Workspace",
      bulletPoints: ["Release review is the top blocker."],
    });

    expect(summary.provider).toBe("mock");
    expect(summary.fallbackReason).toBe("empty_response");
    expect(summary.attempts).toBe(1);
    expect(summary.traceId).toMatch(/^ai_/);

    const diagnostics = readAiSummaryDiagnostics(5);
    expect(diagnostics[0]?.message).toMatch(/empty/i);
    expect(diagnostics[0]?.traceId).toBe(summary.traceId);
  });

  it("supports a forced fallback drill without calling the provider", async () => {
    const create = vi.fn();

    __setAiServiceTestClient({
      responses: { create },
    } as never);

    const summary = await generateStructuredSummary(
      {
        workspaceName: "Pulse Workspace",
        summaryType: "workspace-insight",
        focus: "Fallback drill",
        bulletPoints: ["Exercise the deterministic fallback path for operators."],
      },
      {
        forceFallbackReason: "operator_fallback_drill",
      },
    );

    expect(create).not.toHaveBeenCalled();
    expect(summary.provider).toBe("mock");
    expect(summary.fallbackReason).toBe("operator_fallback_drill");
    expect(summary.traceId).toMatch(/^ai_/);

    const diagnostics = readAiSummaryDiagnostics(5);
    expect(diagnostics[0]?.message).toMatch(/fallback drill forced mock output/i);
    expect(diagnostics[0]?.context?.forced).toBe(true);
    expect(diagnostics[0]?.traceId).toBe(summary.traceId);
  });

  it("uses the budget guard before calling the provider when daily spend is exhausted", async () => {
    const create = vi.fn();

    __setAiServiceTestClient({
      responses: { create },
    } as never);
    __setAiServiceTestConfig({
      providerMode: "auto",
      timeoutMs: 8_000,
      maxAttempts: 2,
      allowMockFallback: true,
      dailyBudgetUsd: 0.01,
      estimatedCostPerRunUsd: 0.02,
      evaluationsEnabled: true,
    });

    const summary = await generateStructuredSummary({
      workspaceName: "Pulse Workspace",
      summaryType: "triage-brief",
      focus: "Budget guard check",
      bulletPoints: ["Provider spending should be blocked by the configured guard."],
    });

    expect(create).not.toHaveBeenCalled();
    expect(summary.provider).toBe("mock");
    expect(summary.fallbackReason).toBe("budget_guard");
    expect(readAiSummaryDiagnostics(5)[0]?.message).toMatch(/budget threshold/i);
  });

  it("tracks budget usage after a provider-backed summary succeeds", async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: "Primary lane is stable.\n- Review the release queue.\n- Confirm the EU handoff.\n- Publish the summary.",
    });

    __setAiServiceTestClient({
      responses: { create },
    } as never);
    __setAiServiceTestConfig({
      providerMode: "auto",
      timeoutMs: 8_000,
      maxAttempts: 2,
      allowMockFallback: true,
      dailyBudgetUsd: 1,
      estimatedCostPerRunUsd: 0.05,
      evaluationsEnabled: true,
    });

    await generateStructuredSummary({
      workspaceName: "Pulse Workspace",
      summaryType: "workspace-insight",
      focus: "Budget accounting",
      bulletPoints: ["Track spend after a successful provider-backed run."],
    });

    const snapshot = readAiSummaryBudgetSnapshot();
    expect(snapshot.runs).toBe(1);
    expect(snapshot.usageUsd).toBe(0.05);
    expect(snapshot.remainingUsd).toBe(0.95);
  });
});
