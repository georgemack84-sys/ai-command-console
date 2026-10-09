import { describe, expect, it } from "vitest";
import { canHandleTerminalReadCommand, executeTerminalReadCommand } from "@/src/server/services/terminal-read-command-service";

describe("terminal read command service", () => {
  it("allows only explicit read and help commands", () => {
    expect(canHandleTerminalReadCommand("help")).toBe(true);
    expect(canHandleTerminalReadCommand("inbox:list")).toBe(true);
    expect(canHandleTerminalReadCommand("watcher:run")).toBe(false);
  });

  it("formats read commands without invoking an execution handler", () => {
    const overview = { collaboration: { inbox: [], notificationHistory: [], notificationDigest: {}, approvalTrustDashboard: {} } };

    expect(executeTerminalReadCommand("help", overview)).toContain("Available Commands");
    expect(executeTerminalReadCommand("inbox:list", overview)).toContain("Operator inbox");
    expect(executeTerminalReadCommand("unknown", overview)).toBeNull();
  });
});
