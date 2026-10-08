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

const owner = { id: "owner_1", workspaceId: "workspace_1", name: "Owner", email: "owner@example.com", role: "operator" as const };
const other = { id: "operator_2", workspaceId: "workspace_1", name: "Other", email: "other@example.com", role: "operator" as const };
const stranger = { id: "operator_3", workspaceId: "workspace_1", name: "Stranger", email: "stranger@example.com", role: "operator" as const };
const admin = { id: "admin_1", workspaceId: "workspace_1", name: "Admin", email: "admin@example.com", role: "admin" as const };
const viewer = { id: "viewer_1", workspaceId: "workspace_1", name: "Viewer", email: "viewer@example.com", role: "viewer" as const };

describe("terminal collaboration service", () => {
  let tempRoot: string;
  let service: typeof import("@/src/server/services/terminal-collaboration-service");
  let collaboration: any;
  let stateDatabase: any;

  beforeEach(async () => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-command-console-collaboration-"));
    process.env = { ...originalEnv, AI_COMMAND_CONSOLE_DATA_ROOT: tempRoot };
    vi.resetModules();
    [collaborationPath, stateDatabasePath, runtimePathsPath, auditTrailPath].forEach((modulePath) => delete require.cache[modulePath]);
    service = await import("@/src/server/services/terminal-collaboration-service");
    collaboration = require("../../services/collaboration.js");
    stateDatabase = require("../../services/stateDatabase.js");
  });

  afterEach(() => {
    stateDatabase.closeDatabase();
    [collaborationPath, stateDatabasePath, runtimePathsPath, auditTrailPath].forEach((modulePath) => delete require.cache[modulePath]);
    process.env = { ...originalEnv };
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("creates, assigns, and archives an owned shared session", async () => {
    await service.executeTerminalCollaborationAction(
      { action: "collaboration:share-session", payload: { name: "Incident room", draftCommand: "inbox:list", macros: [{ name: "Inbox", command: "inbox:list" }], sharedWith: ["team"] } },
      owner,
    );
    const created = collaboration.loadCollaborationState().sharedSessions[0];

    await expect(
      service.executeTerminalCollaborationAction(
        { action: "collaboration:assign-session", payload: { sessionId: created.id, assignedTo: "operator_2" } },
        other,
      ),
    ).rejects.toMatchObject({ status: 403 });

    await service.executeTerminalCollaborationAction(
      { action: "collaboration:assign-session", payload: { sessionId: created.id, assignedTo: "operator_2" } },
      owner,
    );
    expect(collaboration.getSharedSession(created.id)).toEqual(expect.objectContaining({ assignedTo: "operator_2", status: "active" }));

    await service.executeTerminalCollaborationAction(
      { action: "collaboration:archive-session", payload: { sessionId: created.id } },
      admin,
    );
    expect(collaboration.getSharedSession(created.id)).toEqual(expect.objectContaining({ status: "archived", archivedById: admin.id }));
  });

  it("publishes reusable macros while enforcing owner and viewer boundaries", async () => {
    await expect(
      service.executeTerminalCollaborationAction(
        { action: "collaboration:save-shared-macro", payload: { name: "Health", command: "dashboard:health", sharedWith: ["team"] } },
        viewer,
      ),
    ).rejects.toMatchObject({ status: 403 });

    await service.executeTerminalCollaborationAction(
      { action: "collaboration:save-shared-macro", payload: { name: "Health", command: "dashboard:health", sharedWith: ["team"] } },
      owner,
    );
    const macro = collaboration.loadCollaborationState().sharedMacros[0];
    expect(macro).toEqual(expect.objectContaining({ name: "Health", ownerId: owner.id, status: "active" }));

    await expect(
      service.executeTerminalCollaborationAction(
        { action: "collaboration:archive-shared-macro", payload: { macroId: macro.id } },
        other,
      ),
    ).rejects.toMatchObject({ status: 403 });

    await service.executeTerminalCollaborationAction(
      { action: "collaboration:archive-shared-macro", payload: { macroId: macro.id } },
      owner,
    );
    expect(collaboration.getSharedMacro(macro.id)).toEqual(expect.objectContaining({ status: "archived" }));
  });

  it("governs handoff notes, delegation, and closure by participant", async () => {
    await expect(
      service.executeTerminalCollaborationAction(
        { action: "collaboration:create-handoff", payload: { title: "Review release", note: "Check the rollout", assignedTo: other.id } },
        viewer,
      ),
    ).rejects.toMatchObject({ status: 403 });

    await service.executeTerminalCollaborationAction(
      { action: "collaboration:create-handoff", payload: { title: "Review release", note: "Check the rollout", assignedTo: other.id } },
      owner,
    );
    const handoff = collaboration.loadCollaborationState().handoffs[0];

    await expect(
      service.executeTerminalCollaborationAction(
        { action: "collaboration:add-handoff-note", payload: { handoffId: handoff.id, note: "I should not see this" } },
        stranger,
      ),
    ).rejects.toMatchObject({ status: 403 });

    await service.executeTerminalCollaborationAction(
      { action: "collaboration:add-handoff-note", payload: { handoffId: handoff.id, note: "Validated the first checkpoint" } },
      other,
    );
    expect(collaboration.getHandoff(handoff.id).notes).toEqual([
      expect.objectContaining({ note: "Validated the first checkpoint", authorId: other.id }),
    ]);

    await service.executeTerminalCollaborationAction(
      { action: "collaboration:delegate-handoff", payload: { handoffId: handoff.id, assignedTo: stranger.id, note: "Please finish the review" } },
      owner,
    );
    expect(collaboration.getHandoff(handoff.id)).toEqual(
      expect.objectContaining({ assignedTo: stranger.id, reassignedById: owner.id }),
    );
    expect(collaboration.getHandoff(handoff.id).notes.at(-1)).toEqual(
      expect.objectContaining({ note: "Please finish the review", authorId: owner.id }),
    );

    await expect(
      service.executeTerminalCollaborationAction(
        { action: "collaboration:close-handoff", payload: { handoffId: handoff.id } },
        other,
      ),
    ).rejects.toMatchObject({ status: 403 });

    await service.executeTerminalCollaborationAction(
      { action: "collaboration:close-handoff", payload: { handoffId: handoff.id } },
      admin,
    );
    expect(collaboration.getHandoff(handoff.id)).toEqual(
      expect.objectContaining({ status: "closed", closedById: admin.id }),
    );

    await expect(
      service.executeTerminalCollaborationAction(
        { action: "collaboration:add-handoff-note", payload: { handoffId: handoff.id, note: "Too late" } },
        admin,
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
});
