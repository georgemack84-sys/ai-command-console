import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  generateWorkspaceIncidentSummary,
  defaultIncidentChecklist,
  getIncidentPolicy,
  getIncidentTransitionState,
  buildIncidentApprovalSla,
  selectAdaptiveApprovalTarget,
} = require("../../services/legacyConsoleIncidentPolicySupport.js");

describe("legacy console incident policy support", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-09T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds incident summaries and default checklists", () => {
    const summary = generateWorkspaceIncidentSummary(
      {
        workspaceId: "alpha",
        workspaceName: "Alpha",
        status: "error",
        digestEnabledUsers: 3,
        dueUsers: 2,
        lastSweepError: "Timeout",
        escalationOwner: "Jamie",
        events: [
          { type: "workspace-note", note: "Primary database degraded" },
          { type: "workspace-note", note: "Fallback path active" },
        ],
      },
      [{ description: "Restart the worker", status: "completed" }],
    );

    expect(summary).toContain("Workspace Alpha is currently error.");
    expect(summary).toContain("Last sweep error: Timeout.");
    expect(summary).toContain("Current owner: Jamie.");
    expect(summary).toContain("Notes: Primary database degraded Fallback path active");
    expect(summary).toContain("Completed follow-ups: Restart the worker.");

    const checklist = defaultIncidentChecklist([
      { id: "owner_assigned", completed: true, completedAt: "2026-04-09T11:00:00.000Z", completedByName: "Alex" },
    ]);
    expect(checklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "owner_assigned",
          completed: true,
          completedByName: "Alex",
        }),
        expect.objectContaining({
          id: "shared_handoff",
          completed: false,
        }),
      ]),
    );
  });

  it("builds incident policy and transition blockers from governance", () => {
    const deps = {
      getEnvironmentPolicy: vi.fn(() => ({
        currentEnvironment: "production",
        requireChecklistForResolved: true,
        requiredChecklistForResolved: ["owner_assigned", "summary_generated"],
        requireSummaryShareBeforeArchived: true,
        requireApprovalForResolved: true,
        requireApprovalForArchived: true,
        incidentApprovalReminderMinutes: 10,
        incidentApprovalEscalationMinutes: 20,
        incidentApprovalEscalationTarget: "role:admin",
        incidentApprovalFinalEscalationMinutes: 40,
        incidentApprovalFinalEscalationTarget: "team",
        incidentApprovalCapacityLimit: 2,
      })),
    };

    const policy = getIncidentPolicy({}, "alpha", deps);
    expect(policy).toEqual(
      expect.objectContaining({
        environment: "production",
        requiredChecklistForResolved: ["owner_assigned", "summary_generated"],
        incidentApprovalCapacityLimit: 2,
      }),
    );

    const transition = getIncidentTransitionState(
      {
        workspaceId: "alpha",
        incidentStatus: "active",
        incidentChecklist: [
          { id: "owner_assigned", label: "Assign an incident owner", completed: false },
          { id: "summary_generated", label: "Generate an incident summary", completed: true },
        ],
      },
      {},
      deps,
    );

    expect(transition.canResolve).toBe(false);
    expect(transition.canArchive).toBe(false);
    expect(transition.resolveBlockers[0]).toBe('Complete "Assign an incident owner" before resolving this incident.');
    expect(transition.archiveBlockers).toEqual([
      "Share the incident summary before archiving this incident.",
      "Move the incident into a resolved or shared state before archiving it.",
    ]);
  });

  it("builds incident approval SLA windows", () => {
    const sla = buildIncidentApprovalSla(
      { createdAt: "2026-04-09T11:00:00.000Z" },
      {
        incidentApprovalReminderMinutes: 10,
        incidentApprovalEscalationMinutes: 20,
        incidentApprovalFinalEscalationMinutes: 30,
      },
    );

    expect(sla).toEqual(
      expect.objectContaining({
        ageMs: 60 * 60 * 1000,
        reminderDelayMs: 10 * 60 * 1000,
        escalationDelayMs: 20 * 60 * 1000,
        finalEscalationDelayMs: 30 * 60 * 1000,
        overdue: true,
        escalated: true,
        finalEscalated: true,
        targetAt: "2026-04-09T11:10:00.000Z",
        escalationTargetAt: "2026-04-09T11:20:00.000Z",
        finalEscalationTargetAt: "2026-04-09T11:30:00.000Z",
      }),
    );
  });

  it("selects capacity and adaptive approval routing targets", () => {
    const deps = {
      getEnvironmentPolicy: () => ({
        currentEnvironment: "production",
        incidentApprovalCapacityLimit: 1,
      }),
      buildDigestWorkspaceHealth: () => [{ workspaceId: "alpha" }],
      getDigestSchedulerStatus: () => ({ enabled: true }),
      buildIncidentApprovalPressure: () => [
        { target: "user:primary", pendingCount: 1 },
        { target: "user:backup", pendingCount: 0 },
      ],
      buildApprovalThroughputAnalytics: () => ({
        targets: [
          { target: "user:primary", averageApprovalMs: 40 * 60 * 1000, pending: 1 },
          { target: "user:backup", averageApprovalMs: 10 * 60 * 1000, pending: 0 },
        ],
      }),
      loadCollaborationState: () => ({}),
      matchesTargets: (left: string, set: Set<string>) => set.has(left),
      normalizeTarget: (value: string) => value,
    };

    const capacity = selectAdaptiveApprovalTarget("alpha", "user:primary", "user:backup", {}, deps);
    expect(capacity).toEqual(
      expect.objectContaining({
        approverTarget: "user:backup",
        routedByCapacity: true,
        mode: "capacity",
      }),
    );

    const adaptive = selectAdaptiveApprovalTarget(
      "alpha",
      "user:primary",
      "user:backup",
      { force: false },
      {
        ...deps,
        getEnvironmentPolicy: () => ({
          currentEnvironment: "production",
          incidentApprovalCapacityLimit: 3,
        }),
        buildIncidentApprovalPressure: () => [
          { target: "user:primary", pendingCount: 2 },
          { target: "user:backup", pendingCount: 0 },
        ],
      },
    );

    expect(adaptive).toEqual(
      expect.objectContaining({
        approverTarget: "user:backup",
        routedAdaptively: true,
        mode: "adaptive",
        routedFromTarget: "user:primary",
      }),
    );
  });
});
