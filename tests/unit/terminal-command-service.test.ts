import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetTerminalCommandDepsForTest,
  __setTerminalCommandDepsForTest,
  canHandleTerminalCommand,
  executeTerminalCommand,
} from "@/src/server/services/terminal-command-service";

const mockListBriefs = async () => [
  {
    id: "brief_1",
    title: "Track rumor velocity",
    question: "What changed in the monitored sources today?",
    status: "draft",
    ownerId: null,
  },
];

const mockListReports = async () => [
  {
    id: "report_1",
    briefId: "brief_1",
    title: "Morning memo",
    status: "draft",
    ownerId: "user_2",
  },
];

const mockCreateBrief = async (input: Record<string, unknown>) => ({
  id: "brief_created",
  title: input.title,
  question: input.question,
  status: "draft",
});

const mockExecuteResearchAction = async (input: { action: string }) => ({
  action: input.action,
  output:
    input.action === "brief:route"
      ? 'Queued brief "Track rumor velocity" as task_123.'
      : input.action === "report:create"
        ? 'Created draft report "Morning memo".'
        : 'Published report "Morning memo".',
});

vi.mock("@/src/server/services/research-service", () => ({
  listBriefs: mockListBriefs,
  listReports: mockListReports,
  createBrief: mockCreateBrief,
}));

vi.mock("@/src/server/services/research-action-service", () => ({
  executeResearchAction: mockExecuteResearchAction,
}));

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  email: "operator@example.com",
  name: "Operator",
  role: "operator" as const,
};

const mockEnqueueJob = vi.fn();

describe("terminal command service", () => {
  beforeEach(() => {
    mockEnqueueJob.mockReset();
    mockEnqueueJob
      .mockReturnValueOnce({ id: "job_alerts_1" })
      .mockReturnValueOnce({ id: "job_plugin_1" });
    __setTerminalCommandDepsForTest({ enqueueJob: mockEnqueueJob });
  });

  afterEach(() => {
    __resetTerminalCommandDepsForTest();
  });

  it("recognizes extracted alert and plugin commands", () => {
    expect(canHandleTerminalCommand("alerts:list")).toBe(true);
    expect(canHandleTerminalCommand("digest:health")).toBe(true);
    expect(canHandleTerminalCommand("plugins")).toBe(true);
    expect(canHandleTerminalCommand("run plugin helloPlugin")).toBe(true);
    expect(canHandleTerminalCommand("brief:list")).toBe(true);
    expect(canHandleTerminalCommand("report:publish report_1")).toBe(true);
    expect(canHandleTerminalCommand("ownership:signals")).toBe(true);
  });

  it("renders alert summaries without using the legacy console switch", async () => {
    const alerts = await executeTerminalCommand("alerts:list", actor);
    const active = await executeTerminalCommand("alerts:active", actor);

    expect(alerts).toContain("Alerts");
    expect(active).toContain("Active Alerts");
  });

  it("renders digest health from the scheduler and active alert state", async () => {
    const output = await executeTerminalCommand("digest:health", actor);

    expect(output).toContain("Digest Automation Health");
    expect(output).toContain("\"activeAlertCount\":");
    expect(output).toContain("\"scheduler\":");
  });

  it("queues alert sweeps and plugin runs through the job queue", async () => {
    const alertOutput = await executeTerminalCommand("alerts:run", actor);
    const pluginOutput = await executeTerminalCommand("run plugin helloPlugin ./services", actor);

    expect(mockEnqueueJob).toHaveBeenCalledTimes(2);
    expect(alertOutput).toMatch(/^Queued alert sweep as /);
    expect(pluginOutput).toMatch(/^Queued plugin helloPlugin as /);
  });

  it("formats the configured plugin list without consoleApi helpers", async () => {
    const output = await executeTerminalCommand("plugins", actor);

    expect(output === "No plugins configured." || output.includes("Loaded:")).toBe(true);
  });

  it("renders ownership signals from the research records", async () => {
    const output = await executeTerminalCommand("ownership:signals", actor);

    expect(output).toContain("Ownership signals");
    expect(output).toContain("workspace items are unassigned");
  });

  it("routes brief and report terminal commands through the Prisma-backed research services", async () => {
    await expect(executeTerminalCommand("brief:list", actor)).resolves.toContain("Research Briefs");
    await expect(executeTerminalCommand("brief:create New brief | What shifted overnight?", actor)).resolves.toContain("New brief");
    await expect(executeTerminalCommand("brief:route brief_1", actor)).resolves.toContain('Queued brief "Track rumor velocity"');
    await expect(executeTerminalCommand("report:list", actor)).resolves.toContain("Reports");
    await expect(executeTerminalCommand("report:create brief_1 | Morning memo", actor)).resolves.toContain(
      'Created draft report "Morning memo".',
    );
    await expect(executeTerminalCommand("report:publish report_1", actor)).resolves.toContain('Published report "Morning memo".');
  });
});
