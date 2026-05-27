import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.hoisted(() => ({
  addOperatorNote: vi.fn(),
  dismissAdvisory: vi.fn(),
  escalateAdvisory: vi.fn(),
  exportEvidence: vi.fn(),
  fetchEvidence: vi.fn(),
  fetchOperatorView: vi.fn(),
  requestVerification: vi.fn(),
}));

vi.mock("@/lib/recovery/recoveryApiClient", () => apiClient);

import { RecoveryDashboard } from "@/components/recovery/RecoveryDashboard";

function createOperatorView(overrides: Record<string, any> = {}) {
  return {
    executionId: "exec_ui",
    readModel: {
      executionId: "exec_ui",
      execution: { status: "failed" },
      recovery: { status: "failed", attemptsCount: 1 },
      recoveryControl: { status: "approval_required", requiresApproval: true, latestRequestId: "req_1" },
      advisory: { status: "open", latestAdvisoryId: "adv_1", recommendation: "operator_recovery", requiresOperator: true, advisoryOnly: true },
      automation: { status: "blocked", automationAllowed: false },
      autonomy: { status: "requires_operator", autonomyAllowed: false },
      verification: { status: "failed" },
      learning: {
        status: "report_available",
        recommendationCount: 1,
        hasPolicyRecommendations: true,
        hasWarnings: true,
        advisoryOnly: true,
      },
      lock: { isLocked: true, stale: true },
      ledger: { totalEvents: 4, lastEventType: "execution.failed" },
      risk: {
        hasFailure: true,
        hasVerificationFailure: true,
        hasStaleLock: true,
        hasOpenAdvisory: true,
        hasUnsafeUnknown: false,
        hasLearningWarnings: true,
        requiresOperatorAttention: true,
      },
      meta: { completeness: "partial", warnings: [] },
    },
    timeline: {
      executionId: "exec_ui",
      events: [
        {
          eventId: "event_1",
          executionId: "exec_ui",
          timestamp: 1700000000000,
          source: "execution",
          type: "execution_failed",
          severity: "error",
          summary: "execution failed",
        },
      ],
      meta: {
        totalEvents: 1,
        timeRange: { start: 1700000000000, end: 1700000000000 },
        completeness: "partial",
        warnings: [],
        matchesReadModel: true,
      },
    },
    timelineMatchesReadModel: true,
    allowedActions: [
      { action: "ADD_NOTE", allowed: true },
      { action: "REQUEST_VERIFICATION", allowed: true },
      { action: "DISMISS_ADVISORY", allowed: true },
      { action: "ESCALATE_ADVISORY", allowed: true },
      { action: "VIEW_EVIDENCE", allowed: true },
    ],
    warnings: [],
    ...overrides,
  };
}

function createEvidence(overrides: Record<string, any> = {}) {
  return {
    executionId: "exec_ui",
    readModel: createOperatorView().readModel,
    timeline: createOperatorView().timeline,
    state: "normal",
    sections: {
      execution: {},
      recovery: {},
      control: {},
      advisory: {},
      automation: {},
      autonomy: {},
      verification: {},
      learning: {},
      lock: {},
      ledger: {},
    },
    integrity: {
      hash: "abc123hash",
      algorithm: "sha256",
      matchesReadModel: true,
    },
    meta: {
      completeness: "complete",
      warnings: [],
      version: "3.5D-2",
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  apiClient.fetchOperatorView.mockResolvedValue(createOperatorView());
  apiClient.fetchEvidence.mockResolvedValue(createEvidence());
  apiClient.exportEvidence.mockResolvedValue("{}");
  apiClient.requestVerification.mockResolvedValue({ requested: true });
  apiClient.dismissAdvisory.mockResolvedValue({ dismissed: true });
  apiClient.escalateAdvisory.mockResolvedValue({ escalated: true });
  apiClient.addOperatorNote.mockResolvedValue({ noteId: "note_1" });
  Object.defineProperty(globalThis, "URL", {
    value: {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    },
    configurable: true,
  });
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
    const element = originalCreateElement(tagName) as HTMLAnchorElement;
    if (tagName === "a") {
      element.click = vi.fn();
    }
    return element;
  }) as typeof document.createElement);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RecoveryDashboard", () => {
  it("normal evidence renders NORMAL state", async () => {
    render(React.createElement(RecoveryDashboard, { initialExecutionId: "exec_ui" }));
    await waitFor(() => {
      expect(screen.getByTestId("system-state-card")).toHaveTextContent("NORMAL");
    });
  });

  it("disputed evidence renders DISPUTED state", async () => {
    apiClient.fetchEvidence.mockResolvedValue(
      createEvidence({
        state: "disputed",
        integrity: { hash: "abc123hash", algorithm: "sha256", matchesReadModel: false },
        meta: { completeness: "partial", warnings: ["Timeline does not explain current state"], version: "3.5D-2" },
      }),
    );
    apiClient.fetchOperatorView.mockResolvedValue(
      createOperatorView({
        timelineMatchesReadModel: false,
        allowedActions: [
          { action: "ADD_NOTE", allowed: true },
          { action: "REQUEST_VERIFICATION", allowed: false, reason: "Timeline does not currently explain read model" },
          { action: "DISMISS_ADVISORY", allowed: false, reason: "Timeline does not currently explain read model" },
          { action: "ESCALATE_ADVISORY", allowed: false, reason: "Timeline does not currently explain read model" },
          { action: "VIEW_EVIDENCE", allowed: true },
        ],
      }),
    );
    render(React.createElement(RecoveryDashboard, { initialExecutionId: "exec_ui" }));
    await waitFor(() => {
      expect(screen.getByTestId("system-state-card")).toHaveTextContent("DISPUTED");
    });
  });

  it("evidence warnings render", async () => {
    apiClient.fetchEvidence.mockResolvedValue(
      createEvidence({
        state: "disputed",
        integrity: { hash: "abc123hash", algorithm: "sha256", matchesReadModel: false },
        meta: { completeness: "partial", warnings: ["Timeline does not explain current state"], version: "3.5D-2" },
      }),
    );
    render(React.createElement(RecoveryDashboard, { initialExecutionId: "exec_ui" }));
    await waitFor(() => {
      expect(screen.getAllByText(/timeline does not explain current state/i).length).toBeGreaterThan(0);
    });
  });

  it("hash renders", async () => {
    render(React.createElement(RecoveryDashboard, { initialExecutionId: "exec_ui" }));
    await waitFor(() => {
      expect(screen.getAllByText(/abc123hash/i).length).toBeGreaterThan(0);
    });
  });

  it("export buttons visible in disputed state", async () => {
    apiClient.fetchEvidence.mockResolvedValue(
      createEvidence({
        state: "disputed",
        integrity: { hash: "abc123hash", algorithm: "sha256", matchesReadModel: false },
        meta: { completeness: "partial", warnings: ["Timeline does not explain current state"], version: "3.5D-2" },
      }),
    );
    render(React.createElement(RecoveryDashboard, { initialExecutionId: "exec_ui" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /export json/i })).toBeVisible();
      expect(screen.getByRole("button", { name: /export markdown/i })).toBeVisible();
    });
  });

  it("actions disabled in disputed state", async () => {
    apiClient.fetchEvidence.mockResolvedValue(
      createEvidence({
        state: "disputed",
        integrity: { hash: "abc123hash", algorithm: "sha256", matchesReadModel: false },
        meta: { completeness: "partial", warnings: ["Timeline does not explain current state"], version: "3.5D-2" },
      }),
    );
    apiClient.fetchOperatorView.mockResolvedValue(
      createOperatorView({
        timelineMatchesReadModel: false,
        allowedActions: [
          { action: "ADD_NOTE", allowed: true },
          { action: "REQUEST_VERIFICATION", allowed: false, reason: "Timeline does not currently explain read model" },
          { action: "DISMISS_ADVISORY", allowed: false, reason: "Timeline does not currently explain read model" },
          { action: "ESCALATE_ADVISORY", allowed: false, reason: "Timeline does not currently explain read model" },
          { action: "VIEW_EVIDENCE", allowed: true },
        ],
      }),
    );
    render(React.createElement(RecoveryDashboard, { initialExecutionId: "exec_ui" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /request verification/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /dismiss advisory/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /escalate advisory/i })).toBeDisabled();
    });
  });

  it("ADD_NOTE remains enabled", async () => {
    apiClient.fetchEvidence.mockResolvedValue(
      createEvidence({
        state: "disputed",
        integrity: { hash: "abc123hash", algorithm: "sha256", matchesReadModel: false },
        meta: { completeness: "partial", warnings: ["Timeline does not explain current state"], version: "3.5D-2" },
      }),
    );
    render(React.createElement(RecoveryDashboard, { initialExecutionId: "exec_ui" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add note/i })).toBeEnabled();
    });
  });

  it("timeline renders correctly", async () => {
    render(React.createElement(RecoveryDashboard, { initialExecutionId: "exec_ui" }));
    await waitFor(() => {
      expect(screen.getByText(/execution failed/i)).toBeInTheDocument();
    });
  });

  it("export buttons call the API client", async () => {
    render(React.createElement(RecoveryDashboard, { initialExecutionId: "exec_ui" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /export markdown/i })).toBeVisible();
    });
    fireEvent.click(screen.getByRole("button", { name: /export markdown/i }));
    await waitFor(() => {
      expect(apiClient.exportEvidence).toHaveBeenCalledWith("exec_ui", "markdown");
    });
  });
});
