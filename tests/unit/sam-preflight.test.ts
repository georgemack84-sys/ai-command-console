import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedAdapters = vi.hoisted(() => ({
  loadSamReadModelState: vi.fn(),
  loadSamTimelineState: vi.fn(),
  loadSamOperatorActionState: vi.fn(),
  loadSamEvidenceState: vi.fn(),
}));

vi.mock("../../services/sam/adapters/index.ts", () => mockedAdapters);

import { runSamPreflight } from "../../services/sam/samPreflight.ts";

function createProposal(overrides: Record<string, unknown> = {}) {
  return {
    proposalId: "proposal_1",
    executionId: "demo-exec-1",
    attemptId: "attempt_1",
    actionType: "recover_execution",
    requestedBy: "ai",
    reason: "Need governed recovery preview.",
    riskLevel: "high",
    confidence: 0.7,
    params: {},
    createdAt: "2026-05-06T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedAdapters.loadSamReadModelState.mockResolvedValue({
    readModelAvailable: true,
    readModel: {
      lock: { stale: false, isLocked: false },
    },
    source: "3.5A",
  });
  mockedAdapters.loadSamTimelineState.mockResolvedValue({
    timelineConsistent: true,
    disputedState: false,
    source: "3.5B",
  });
  mockedAdapters.loadSamOperatorActionState.mockResolvedValue({
    operatorActionAllowed: true,
    source: "3.5C",
  });
  mockedAdapters.loadSamEvidenceState.mockResolvedValue({
    evidenceValid: true,
    disputedState: false,
    source: "3.5D",
  });
});

describe("sam preflight", () => {
  it("blocks missing read model", async () => {
    mockedAdapters.loadSamReadModelState.mockResolvedValue({
      readModelAvailable: false,
      reason: "SAM_READ_MODEL_UNAVAILABLE",
      source: "NOT_FOUND",
    });

    const result = await runSamPreflight({ proposal: createProposal() as any });
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("SAM_READ_MODEL_UNAVAILABLE");
  });

  it("blocks invalid evidence", async () => {
    mockedAdapters.loadSamEvidenceState.mockResolvedValue({
      evidenceValid: false,
      disputedState: false,
      reason: "SAM_EVIDENCE_INVALID",
      source: "3.5D",
    });

    const result = await runSamPreflight({ proposal: createProposal() as any });
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("SAM_EVIDENCE_INVALID");
  });

  it("blocks disputed timeline", async () => {
    mockedAdapters.loadSamTimelineState.mockResolvedValue({
      timelineConsistent: false,
      disputedState: true,
      reason: "SAM_TIMELINE_DISPUTED",
      source: "3.5B",
    });

    const result = await runSamPreflight({ proposal: createProposal() as any });
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("SAM_TIMELINE_DISPUTED");
  });

  it("blocks disallowed operator action", async () => {
    mockedAdapters.loadSamOperatorActionState.mockResolvedValue({
      operatorActionAllowed: false,
      reason: "SAM_OPERATOR_ACTION_BLOCKED",
      source: "3.5C",
    });

    const result = await runSamPreflight({ proposal: createProposal() as any });
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("SAM_OPERATOR_ACTION_BLOCKED");
  });

  it("blocks unknown action", async () => {
    const result = await runSamPreflight({
      proposal: createProposal({ actionType: "unknown" }) as any,
    });
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("SAM_ACTION_UNKNOWN");
  });
});
