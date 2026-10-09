import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceMember: vi.fn() }));
vi.mock("@/src/server/agents/agent-service", () => ({ listAgentTasks: vi.fn() }));
vi.mock("@/src/server/feature-flags/feature-flag-service", () => ({ isFeatureEnabled: vi.fn() }));
vi.mock("@/src/server/services/governed-agent-task-action-service", () => ({
  executeGovernedAgentTaskAction: vi.fn(),
}));

import { POST } from "@/app/api/agents/tasks/route";
import { getSessionUser } from "@/src/lib/auth";
import { isFeatureEnabled } from "@/src/server/feature-flags/feature-flag-service";
import { executeGovernedAgentTaskAction } from "@/src/server/services/governed-agent-task-action-service";

const user = {
  id: "user_1",
  email: "operator@example.com",
  name: "Operator",
  role: "operator",
  status: "active",
  workspaceId: "workspace_1",
  workspaceName: "Workspace",
};

describe("agent tasks route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue(user);
    vi.mocked(isFeatureEnabled).mockResolvedValue(true);
  });

  it("creates tasks through governed action execution", async () => {
    vi.mocked(executeGovernedAgentTaskAction).mockResolvedValue({
      data: { task: { id: "task_1" }, job: { id: "job_1" } },
      status: 201,
    } as never);

    const response = await POST(new Request("http://localhost/api/agents/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "research", input: { topic: "runtime" }, runNow: true }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.data.task.id).toBe("task_1");
    expect(executeGovernedAgentTaskAction).toHaveBeenCalledWith(
      { type: "research", input: { topic: "runtime" }, runNow: true },
      user,
    );
  });

  it("returns control evidence without mutating when confirmation is required", async () => {
    vi.mocked(executeGovernedAgentTaskAction).mockResolvedValue({
      action: "create",
      output: "Confirmation required.",
      requiresConfirmation: true,
    } as never);

    const response = await POST(new Request("http://localhost/api/agents/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "research", runNow: true }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.requiresConfirmation).toBe(true);
  });
});
