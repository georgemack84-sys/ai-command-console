import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  runPolicyAction,
  updateAgentConfiguration,
  createResearchBrief,
  runCollaborationCoreAction,
} = require("../../services/legacyConsoleCoreProductSupport.js");

describe("legacy console core product support", () => {
  it("updates thresholds and automation policy with optional side effects", () => {
    const updateAlertThresholds = vi.fn(() => ({ cpu: 80 }));
    const updateAutomationPolicy = vi.fn(() => ({
      escalation: {
        autoRunWatcherOnPolicySave: true,
        autoRunAlertsOnPolicySave: true,
      },
      remediation: {},
    }));
    const evaluateRules = vi.fn();
    const runAlertChecks = vi.fn();

    const thresholds = runPolicyAction("policy:update-thresholds", { cpu: 80 }, {
      updateAlertThresholds,
      updateAutomationPolicy,
      evaluateRules,
      runAlertChecks,
    });
    expect(thresholds).toEqual(expect.objectContaining({ ok: true, output: "Updated alert thresholds." }));
    expect(updateAlertThresholds).toHaveBeenCalledWith({ cpu: 80 });

    const automation = runPolicyAction("policy:update-automation", { escalation: { enabled: true } }, {
      updateAlertThresholds,
      updateAutomationPolicy,
      evaluateRules,
      runAlertChecks,
    });
    expect(automation).toEqual(expect.objectContaining({ ok: true, output: "Updated automation policy." }));
    expect(evaluateRules).toHaveBeenCalled();
    expect(runAlertChecks).toHaveBeenCalled();
  });

  it("updates agent configuration through the extracted helper", () => {
    const updateAgentProfile = vi.fn(() => ({ role: "operator" }));

    const result = updateAgentConfiguration(
      {
        agentName: "ops-bot",
        role: "operator",
        description: "Handles operations",
        tags: ["ops"],
      },
      { updateAgentProfile },
    );

    expect(updateAgentProfile).toHaveBeenCalledWith("ops-bot", expect.objectContaining({
      role: "operator",
      description: "Handles operations",
      tags: ["ops"],
    }));
    expect(result.output).toBe("Updated profile for ops-bot.");
  });

  it("creates research briefs with normalized defaults", () => {
    const createBriefRecord = vi.fn(() => ({ id: "brief_1", title: "Investigate churn" }));
    const formatBriefs = vi.fn(() => "formatted brief");

    const result = createResearchBrief(
      "alpha",
      { title: "Investigate churn", question: "Why did churn spike?" },
      { createBriefRecord, formatBriefs },
    );

    expect(createBriefRecord).toHaveBeenCalledWith("alpha", expect.objectContaining({
      title: "Investigate churn",
      question: "Why did churn spike?",
      assignedAgent: "researcher",
      priority: "medium",
      summary: "Created from the command desk.",
    }));
    expect(result.output).toBe("formatted brief");
  });

  it("handles collaboration session and handoff helpers", () => {
    const upsertSharedSession = vi.fn(() => ({ id: "session_1", name: "Night shift" }));
    const createHandoff = vi.fn(() => ({ id: "handoff_1", title: "Escalate incident" }));
    const closeHandoff = vi.fn()
      .mockReturnValueOnce({ id: "handoff_1", title: "Escalate incident" })
      .mockReturnValueOnce(null);
    const actor = { id: "user_1", name: "Alex" };

    const session = runCollaborationCoreAction("collaboration:share-session", { name: "Night shift" }, actor, {
      upsertSharedSession,
      createHandoff,
      closeHandoff,
    });
    expect(session).toEqual(expect.objectContaining({ ok: true, output: 'Shared session "Night shift".' }));

    const handoff = runCollaborationCoreAction("collaboration:create-handoff", { title: "Escalate incident", note: "Please investigate" }, actor, {
      upsertSharedSession,
      createHandoff,
      closeHandoff,
    });
    expect(handoff).toEqual(expect.objectContaining({ ok: true, output: 'Created handoff "Escalate incident".' }));

    const closed = runCollaborationCoreAction("collaboration:close-handoff", { handoffId: "handoff_1" }, actor, {
      upsertSharedSession,
      createHandoff,
      closeHandoff,
    });
    expect(closed).toEqual(expect.objectContaining({ ok: true, output: 'Closed handoff "Escalate incident".' }));

    const missing = runCollaborationCoreAction("collaboration:close-handoff", { handoffId: "missing" }, actor, {
      upsertSharedSession,
      createHandoff,
      closeHandoff,
    });
    expect(missing).toEqual({ ok: false, error: "Handoff not found: missing" });
  });
});
