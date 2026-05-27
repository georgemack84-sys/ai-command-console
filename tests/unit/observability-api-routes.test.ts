import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceMember: vi.fn(),
}));

vi.mock("@/services/sam/samBridgeController", () => ({
  runSamBridge: vi.fn(),
}));

vi.mock("@/services/observability/metricSnapshot", () => ({
  buildMetricSnapshot: vi.fn(),
}));

vi.mock("@/services/observability/systemHealth", () => ({
  buildSystemHealthSnapshot: vi.fn(),
}));

vi.mock("@/services/observability/alertEvaluator", () => ({
  evaluateCurrentAlerts: vi.fn(),
}));

import { getSessionUser } from "@/src/lib/auth";
import { runSamBridge } from "@/services/sam/samBridgeController";
import { buildMetricSnapshot } from "@/services/observability/metricSnapshot";
import { buildSystemHealthSnapshot } from "@/services/observability/systemHealth";
import { evaluateCurrentAlerts } from "@/services/observability/alertEvaluator";
import { GET as HealthGET } from "@/app/api/v1/observability/health/route";
import { GET as MetricsGET } from "@/app/api/v1/observability/metrics/route";
import { GET as AlertsGET } from "@/app/api/v1/observability/alerts/route";

describe("observability api routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    } as never);

    vi.mocked(buildMetricSnapshot).mockResolvedValue({
      snapshotId: "snapshot-1",
      generatedAt: "2026-05-07T00:00:00.000Z",
      healthStatus: "DEGRADED",
      metrics: [],
      sources: [],
      degradedSignals: [],
      unknownSignals: [],
    } as never);

    vi.mocked(buildSystemHealthSnapshot).mockReturnValue({
      status: "DEGRADED",
      generatedAt: "2026-05-07T00:00:00.000Z",
      components: [],
      summary: "Some optional sources are unavailable.",
      recommendedAction: "Inspect observability sources.",
    } as never);

    vi.mocked(evaluateCurrentAlerts).mockResolvedValue([] as never);
  });

  it("returns a stable read-only health response", async () => {
    const response = await HealthGET(new Request("http://localhost/api/v1/observability/health"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.status).toBe("DEGRADED");
    expect(vi.mocked(runSamBridge)).not.toHaveBeenCalled();
  });

  it("returns a stable metrics response", async () => {
    const response = await MetricsGET(new Request("http://localhost/api/v1/observability/metrics"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.snapshotId).toBe("snapshot-1");
  });

  it("returns a stable alerts response even when sources are degraded", async () => {
    vi.mocked(evaluateCurrentAlerts).mockResolvedValue([
      {
        alertId: "alert-1",
        ruleId: "system-health-unhealthy",
        severity: "CRITICAL",
        status: "ACTIVE",
        reason: "System health is unhealthy.",
        metricName: "systemHealthStatus",
        observedValue: "UNHEALTHY",
        threshold: "UNHEALTHY",
        triggeredAt: "2026-05-07T00:00:00.000Z",
        correlationId: "health",
        source: "health",
        recommendedAction: "Escalate to operators.",
      },
    ] as never);

    const response = await AlertsGET(new Request("http://localhost/api/v1/observability/alerts"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.alerts).toHaveLength(1);
  });
});
