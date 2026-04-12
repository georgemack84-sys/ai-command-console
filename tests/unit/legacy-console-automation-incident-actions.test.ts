import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  addWorkspaceAutomationNote,
  generateIncidentSummary,
  setIncidentStatus,
  toggleIncidentChecklistItem,
  shareIncidentSummary,
} = require("../../services/legacyConsoleAutomationIncidentActions.js");

describe("legacy console automation incident actions", () => {
  const actor = { id: "user_1", name: "Alex" };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T18:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds workspace notes through the extracted helper", () => {
    const appendDigestWorkspaceEvent = vi.fn();

    const result = addWorkspaceAutomationNote("alpha", "Needs review", actor, {
      appendDigestWorkspaceEvent,
    });

    expect(result).toEqual(expect.objectContaining({ ok: true, output: "Added note for alpha." }));
    expect(appendDigestWorkspaceEvent).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        type: "workspace-note",
        note: "Needs review",
      }),
    );
  });

  it("generates incident summaries and marks checklist state", () => {
    const updateDigestWorkspaceState = vi.fn();
    const updateIncidentChecklistItem = vi.fn();
    const appendDigestWorkspaceEvent = vi.fn();

    const result = generateIncidentSummary("alpha", actor, {
      getDigestSchedulerStatus: vi.fn(() => ({ runs: [] })),
      buildDigestWorkspaceHealth: vi.fn(() => [{ workspaceId: "alpha", workspaceName: "Alpha" }]),
      listAutomationFollowups: vi.fn(() => [{ id: "task_1" }]),
      generateWorkspaceIncidentSummary: vi.fn(() => "Summary text"),
      updateDigestWorkspaceState,
      updateIncidentChecklistItem,
      appendDigestWorkspaceEvent,
    });

    expect(result).toEqual(expect.objectContaining({ ok: true, output: "Generated incident summary for alpha." }));
    expect(updateDigestWorkspaceState).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        incidentSummary: "Summary text",
        incidentSummaryUpdatedAt: "2026-04-10T18:30:00.000Z",
      }),
    );
    expect(updateIncidentChecklistItem).toHaveBeenCalledWith(
      "alpha",
      "summary_generated",
      expect.objectContaining({
        completed: true,
        completedByName: "Alex",
      }),
    );
  });

  it("validates and sets incident status", () => {
    const updateDigestWorkspaceState = vi.fn();
    const appendDigestWorkspaceEvent = vi.fn();

    const invalid = setIncidentStatus("alpha", "archived", actor, {
      loadCollaborationState: vi.fn(() => ({ governance: {} })),
      validateIncidentStatusChange: vi.fn(() => ({ ok: false, error: "Blocked" })),
      updateDigestWorkspaceState,
      appendDigestWorkspaceEvent,
    });
    expect(invalid).toEqual({ ok: false, error: "Blocked" });

    const valid = setIncidentStatus("alpha", "resolved", actor, {
      loadCollaborationState: vi.fn(() => ({ governance: {} })),
      validateIncidentStatusChange: vi.fn(() => ({ ok: true })),
      updateDigestWorkspaceState,
      appendDigestWorkspaceEvent,
    });
    expect(valid).toEqual(expect.objectContaining({ ok: true, output: "Updated incident status for alpha." }));
    expect(updateDigestWorkspaceState).toHaveBeenCalledWith(
      "alpha",
      expect.objectContaining({
        incidentStatus: "resolved",
      }),
    );
  });

  it("toggles checklist items and records the change", () => {
    const updateIncidentChecklistItem = vi.fn();
    const appendDigestWorkspaceEvent = vi.fn();

    const result = toggleIncidentChecklistItem("alpha", "shared_handoff", true, actor, {
      updateIncidentChecklistItem,
      appendDigestWorkspaceEvent,
    });

    expect(result).toEqual(expect.objectContaining({ ok: true, output: "Updated checklist item shared_handoff for alpha." }));
    expect(updateIncidentChecklistItem).toHaveBeenCalledWith(
      "alpha",
      "shared_handoff",
      {
        completed: true,
        completedAt: "2026-04-10T18:30:00.000Z",
        completedByName: "Alex",
      },
    );
  });

  it("shares incident summaries or trust handoff drafts", () => {
    const createHandoff = vi.fn(() => ({ id: "handoff_1" }));
    const updateDigestWorkspaceState = vi.fn();
    const updateIncidentChecklistItem = vi.fn();
    const appendDigestWorkspaceEvent = vi.fn();

    const result = shareIncidentSummary("alpha", "team", false, actor, {
      getDigestSchedulerStatus: vi.fn(() => ({ runs: [] })),
      buildDigestWorkspaceHealth: vi.fn(() => [{
        workspaceId: "alpha",
        workspaceName: "Alpha",
        incidentSummary: "Summary",
        incidentSummaryUpdatedAt: "2026-04-10T17:00:00.000Z",
      }]),
      listAutomationFollowups: vi.fn(() => []),
      generateWorkspaceIncidentSummary: vi.fn(() => "Generated"),
      createHandoff,
      updateDigestWorkspaceState,
      updateIncidentChecklistItem,
      appendDigestWorkspaceEvent,
    });

    expect(result).toEqual(expect.objectContaining({
      ok: true,
      output: "Shared incident summary for alpha with team.",
    }));
    expect(createHandoff).toHaveBeenCalledWith(expect.objectContaining({
      title: "Incident summary: Alpha",
      note: "Summary",
    }));

    const draft = shareIncidentSummary("alpha", "ops", true, actor, {
      getDigestSchedulerStatus: vi.fn(() => ({ runs: [] })),
      buildDigestWorkspaceHealth: vi.fn(() => [{
        workspaceId: "alpha",
        workspaceName: "Alpha",
        incidentHandoffDraft: "Draft handoff",
      }]),
      listAutomationFollowups: vi.fn(() => []),
      generateWorkspaceIncidentSummary: vi.fn(() => "Generated"),
      createHandoff,
      updateDigestWorkspaceState,
      updateIncidentChecklistItem,
      appendDigestWorkspaceEvent,
    });
    expect(draft.output).toBe("Shared trust recovery handoff for alpha with ops.");
  });
});
