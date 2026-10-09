import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const originalEnv = { ...process.env };
const collaborationPath = require.resolve("../../services/collaboration.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const auditTrailPath = require.resolve("../../services/auditTrail.js");
const telemetryPath = require.resolve("../../services/telemetry.js");

const requester = { id: "operator_1", workspaceId: "workspace_1", name: "Operator", email: "operator@example.com", role: "operator" as const };
const approver = { id: "approver_1", workspaceId: "workspace_1", name: "Approver", email: "approver@example.com", role: "approver" as const };
const viewer = { id: "viewer_1", workspaceId: "workspace_1", name: "Viewer", email: "viewer@example.com", role: "viewer" as const };
const governance = {
  currentEnvironment: "production",
  environmentPolicies: { production: { minimumRoleForApprovals: "approver" } },
};

describe("terminal sensitive approval gates", () => {
  let tempRoot: string;
  let service: typeof import("@/src/server/services/terminal-approval-gate-service");
  let stateDatabase: { closeDatabase: () => void };

  beforeEach(async () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-approval-gates-"));
    process.env = { ...originalEnv, AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot };
    vi.resetModules();
    [collaborationPath, stateDatabasePath, runtimePathsPath, auditTrailPath, telemetryPath].forEach((modulePath) => delete require.cache[modulePath]);
    service = await import("@/src/server/services/terminal-approval-gate-service");
    stateDatabase = require("../../services/stateDatabase.js");
  });

  afterEach(() => {
    stateDatabase.closeDatabase();
    [collaborationPath, stateDatabasePath, runtimePathsPath, auditTrailPath, telemetryPath].forEach((modulePath) => delete require.cache[modulePath]);
    process.env = { ...originalEnv };
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("creates one workspace-scoped pending request for repeated sensitive actions", () => {
    const first = service.requestSensitiveActionApproval({
      action: "watcher:stop",
      payload: { reason: "maintenance" },
      actor: requester,
      environment: "production",
    });
    const second = service.requestSensitiveActionApproval({
      action: "watcher:stop",
      payload: { reason: "maintenance" },
      actor: requester,
      environment: "production",
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.request.id).toBe(first.request.id);
    expect(service.listSensitiveApprovalRequests(requester.workspaceId)).toEqual([
      expect.objectContaining({
        id: first.request.id,
        kind: "terminal-sensitive-action",
        workspaceId: requester.workspaceId,
        status: "pending",
        approverTarget: "role:approver,role:admin",
        requestedByEmail: requester.email,
        requestedByRole: requester.role,
      }),
    ]);
  });

  it("requires an independent approver and resolves only after successful execution", async () => {
    const { request } = service.requestSensitiveActionApproval({
      action: "ownership:assign-item",
      payload: { resourceType: "brief", resourceId: "brief_1", ownerId: "user_2" },
      actor: requester,
      environment: "production",
    });

    await expect(
      service.approveSensitiveActionApproval({
        approvalId: request.id,
        actor: requester,
        governance,
        execute: async () => ({ ok: true }),
      }),
    ).rejects.toMatchObject({ code: "sensitive_approval_self_decision", status: 403 });

    await expect(
      service.approveSensitiveActionApproval({
        approvalId: request.id,
        actor: viewer,
        governance,
        execute: async () => ({ ok: true }),
      }),
    ).rejects.toMatchObject({ code: "sensitive_approval_forbidden", status: 403 });

    await expect(
      service.approveSensitiveActionApproval({
        approvalId: request.id,
        actor: approver,
        governance,
        execute: async () => ({ ok: false, error: "Target changed" }),
      }),
    ).rejects.toMatchObject({ code: "sensitive_approval_execution_failed", status: 409 });
    expect(service.getSensitiveApprovalRequest(request.id, requester.workspaceId)?.status).toBe("pending");

    const approved = await service.approveSensitiveActionApproval({
      approvalId: request.id,
      actor: approver,
      governance,
      execute: async (pending) => ({ ok: true, output: `Executed ${pending.action}` }),
    });
    expect(approved.result.output).toBe("Executed ownership:assign-item");
    expect(service.getSensitiveApprovalRequest(request.id, requester.workspaceId)).toEqual(
      expect.objectContaining({ status: "approved", approvedById: approver.id }),
    );
  });

  it("records an independent rejection without executing the action", () => {
    const { request } = service.requestSensitiveActionApproval({
      action: "automation-template:delete",
      payload: { templateId: "template_1" },
      actor: requester,
      environment: "production",
    });
    const rejected = service.rejectSensitiveActionApproval({
      approvalId: request.id,
      note: "Keep the template for the audit window.",
      actor: approver,
      governance,
    });
    expect(rejected).toEqual(
      expect.objectContaining({ status: "rejected", rejectedById: approver.id, rejectionNote: "Keep the template for the audit window." }),
    );
  });

  it("records request-to-decision latency with workspace and environment dimensions", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T01:00:00.000Z"));
    try {
      const { request } = service.requestSensitiveActionApproval({
        action: "watcher:stop",
        payload: { reason: "maintenance" },
        actor: requester,
        environment: "production",
      });
      vi.advanceTimersByTime(1_250);
      await service.approveSensitiveActionApproval({
        approvalId: request.id,
        actor: approver,
        governance,
        execute: async () => ({ ok: true }),
      });

      const telemetry = require("../../services/telemetry.js").buildTelemetrySummary();
      expect(telemetry.totals.avgApprovalLatencyMs).toBe(1_250);
      expect(telemetry.recent).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "approval:decision",
            category: "approval",
            operation: "watcher:stop",
            status: "approved",
            durationMs: 1_250,
            workspaceId: requester.workspaceId,
            environment: "production",
            correlationId: request.id,
          }),
        ]),
      );
      expect(JSON.stringify(telemetry.recent)).not.toContain("maintenance");
    } finally {
      vi.useRealTimers();
    }
  });

  it("isolates duplicate requests and decisions by environment", async () => {
    const staging = service.requestSensitiveActionApproval({
      action: "watcher:stop",
      payload: { reason: "maintenance" },
      actor: requester,
      environment: "staging",
    });
    const production = service.requestSensitiveActionApproval({
      action: "watcher:stop",
      payload: { reason: "maintenance" },
      actor: requester,
      environment: "production",
    });

    expect(production.request.id).not.toBe(staging.request.id);
    expect(service.listSensitiveApprovalRequests(requester.workspaceId, "staging")).toEqual([
      expect.objectContaining({ id: staging.request.id, environment: "staging" }),
    ]);

    await expect(
      service.approveSensitiveActionApproval({
        approvalId: staging.request.id,
        actor: approver,
        governance,
        execute: async () => ({ ok: true }),
      }),
    ).rejects.toMatchObject({ code: "approval_environment_changed", status: 409 });
  });
});
