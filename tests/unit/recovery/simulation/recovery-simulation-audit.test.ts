import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../services/auditTrail.js", () => ({
  appendAuditEvent: vi.fn((event: Record<string, unknown>) => ({
    id: `audit_${String(event.type)}`,
    timestamp: "2026-05-08T12:00:00.000Z",
    ...event,
  })),
}));

import { appendRecoverySimulationAuditTrail } from "../../../../services/recovery/simulation/recoverySimulationAudit";

describe("recovery simulation audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates simulation-scoped audit events", () => {
    const events = appendRecoverySimulationAuditTrail({
      simulationId: "sim-1",
      executionId: "exec-1",
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      events: [
        { type: "simulation.started" },
        { type: "simulation.completed" },
      ],
    });

    expect(events).toHaveLength(2);
    expect(String(events[0].id)).toContain("audit_");
  });
});
