/* eslint-disable @typescript-eslint/no-unused-vars */
// operations compatibility for the legacy console compatibility shell.
import test from "node:test";
import assert from "node:assert/strict";
import {
  fs,
  path,
  handleConsoleRequest,
  queueDueDigestSweepIfNeeded,
  runDigestSchedulerSweep,
  stopDigestScheduler,
  loadQueue,
  saveQueue,
  completeTask,
  saveReviewState,
  saveAlertsState,
  clearAuditEvents,
  listAuditEvents,
  saveSchedulerState,
  loadCollaborationState,
  saveCollaborationState,
  listDigestRuns,
  updateDigestWorkspaceState,
  clearTelemetry,
  buildTelemetrySummary,
  clearJobs,
  runPendingJobs,
  enqueueJob,
  updateJob,
  registerJobProcessor,
  FILES,
  AGENT_PROFILE_PATH,
  ROUTES_STORE_PATH,
  BRIEFS_STORE_PATH,
  REPORTS_STORE_PATH,
  WORKSPACE_USERS_PATH,
  resetState,
  snapshotFiles,
  restoreFiles,
} from "./helpers/legacy-console-fixture.mjs";

test("due digest sweep generates background digests for eligible workspace users", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_due_digest_test";

    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          {
            id: "alex",
            email: "alex@example.com",
            name: "Alex Editor",
            role: "operator",
            status: "active",
            workspaceId,
            workspaceName: "Due Digest Workspace",
            createdAt: new Date().toISOString(),
          },
          {
            id: "jamie",
            email: "jamie@example.com",
            name: "Jamie Lead",
            role: "admin",
            status: "active",
            workspaceId,
            workspaceName: "Due Digest Workspace",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    fs.writeFileSync(
      BRIEFS_STORE_PATH,
      JSON.stringify(
        {
          [workspaceId]: [
            { id: "brief_due_digest", title: "Due digest brief", question: "Needs routing", status: "draft", priority: "medium", assignedAgent: "researcher", tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), summary: "orphaned", linkedTaskId: null },
          ],
        },
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      {
        action: "collaboration:digest-preferences",
        payload: {
          enabled: true,
          cadence: "daily",
          preferredChannel: "history",
        },
      },
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );

    await handleConsoleRequest(
      {
        action: "collaboration:create-handoff",
        payload: {
          title: "Digest handoff",
          note: "This should make Alex eligible for a due digest.",
          assignedTo: "user:alex",
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const queued = await handleConsoleRequest(
      { action: "collaboration:digest-run-due", payload: {} },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.equal(queued.ok, true);
    assert.match(queued.output, /Queued digest sweep/i);

    await runPendingJobs();

    const alexView = await handleConsoleRequest(
      { command: "help" },
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );

    assert.ok(alexView.overview.collaboration.digestRuns.length >= 1);
    assert.match(alexView.overview.collaboration.digestRuns[0].summary, /open notifications/i);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("operations overview includes a global cross-workspace control-plane summary", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceA = "workspace_global_ops_alpha";
    const workspaceB = "workspace_global_ops_beta";

    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          {
            id: "jamie",
            email: "jamie@example.com",
            name: "Jamie Lead",
            role: "admin",
            status: "active",
            workspaceId: workspaceA,
            workspaceName: "Alpha Workspace",
            createdAt: new Date().toISOString(),
          },
          {
            id: "alex",
            email: "alex@example.com",
            name: "Alex Lead",
            role: "admin",
            status: "active",
            workspaceId: workspaceB,
            workspaceName: "Beta Workspace",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      {
        action: "collaboration:digest-preferences",
        payload: {
          enabled: true,
          cadence: "daily",
          preferredChannel: "history",
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId: workspaceA }
    );

    await handleConsoleRequest(
      {
        action: "collaboration:digest-preferences",
        payload: {
          enabled: true,
          cadence: "daily",
          preferredChannel: "history",
        },
      },
      { userId: "alex", userName: "Alex Lead", userRole: "admin", workspaceId: workspaceB }
    );

    updateDigestWorkspaceState(workspaceA, {
      lastSweepError: "Digest run failed.",
      incidentStatus: "open",
      incidentApproverTarget: "user:pat",
    });
    updateDigestWorkspaceState(workspaceB, {
      incidentStatus: "resolved",
    });

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.environmentPolicies = {
      production: {
        trustDropAction: "notify",
      },
    };
    collab.approvals = [
      {
        id: "approval_global_ops",
        action: "collaboration:automation-set-status",
        label: "Approve incident resolved for Alpha Workspace",
        status: "pending",
        payload: {
          workspaceId: workspaceA,
          incidentStatus: "resolved",
        },
        approverTarget: "user:pat",
        createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        requestedById: "jamie",
        requestedByName: "Jamie Lead",
      },
    ];
    saveCollaborationState(collab);

    const overview = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId: workspaceA }
    );

    const globalOps = overview.overview.collaboration.globalOperations;
    assert.equal(globalOps.totals.workspaceCount, 2);
    assert.ok(globalOps.totals.unhealthyWorkspaces >= 1);
    assert.ok(globalOps.totals.pendingApprovals >= 1);
    assert.ok(globalOps.environments.some((item) => item.environment === "production"));
    assert.ok(globalOps.hotspots.some((item) => item.workspaceId === workspaceA));
    assert.ok(globalOps.pressureTargets.some((item) => item.target === "user:pat"));
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("admins can bulk queue sweeps for unhealthy workspaces in one environment", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceAlpha = "workspace_bulk_sweep_alpha";
    const workspaceBeta = "workspace_bulk_sweep_beta";
    const workspaceGamma = "workspace_bulk_sweep_gamma";

    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          {
            id: "admin",
            email: "admin@example.com",
            name: "Admin User",
            role: "admin",
            status: "active",
            workspaceId: workspaceAlpha,
            workspaceName: "Bulk Sweep Alpha",
            createdAt: new Date().toISOString(),
          },
          {
            id: "beta-admin",
            email: "beta@example.com",
            name: "Beta Admin",
            role: "admin",
            status: "active",
            workspaceId: workspaceBeta,
            workspaceName: "Bulk Sweep Beta",
            createdAt: new Date().toISOString(),
          },
          {
            id: "gamma-admin",
            email: "gamma@example.com",
            name: "Gamma Admin",
            role: "admin",
            status: "active",
            workspaceId: workspaceGamma,
            workspaceName: "Bulk Sweep Gamma",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      { action: "collaboration:digest-preferences", payload: { enabled: true, cadence: "daily", preferredChannel: "history" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: workspaceAlpha }
    );
    await handleConsoleRequest(
      { action: "collaboration:digest-preferences", payload: { enabled: true, cadence: "daily", preferredChannel: "history" } },
      { userId: "beta-admin", userName: "Beta Admin", userRole: "admin", workspaceId: workspaceBeta }
    );
    await handleConsoleRequest(
      { action: "collaboration:digest-preferences", payload: { enabled: true, cadence: "daily", preferredChannel: "history" } },
      { userId: "gamma-admin", userName: "Gamma Admin", userRole: "admin", workspaceId: workspaceGamma }
    );

    updateDigestWorkspaceState(workspaceAlpha, { lastSweepError: "Alpha failed." });
    updateDigestWorkspaceState(workspaceBeta, { lastSweepError: "Beta failed." });
    updateDigestWorkspaceState(workspaceGamma, { lastSweepRunAt: new Date().toISOString() });

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.environmentPolicies = {
      production: { trustDropAction: "notify" },
    };
    saveCollaborationState(collab);

    const bulk = await handleConsoleRequest(
      {
        action: "collaboration:automation-bulk-run-sweep",
        payload: { environment: "production", statuses: ["error", "stalled"] },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: workspaceAlpha }
    );

    assert.equal(bulk.ok, true);
    assert.match(bulk.output, /Queued 2 automation sweeps/i);
    assert.equal(
      bulk.overview.jobs.items.filter((item) => item.type === "digest:run-due").length >= 2,
      true
    );
    assert.equal(
      bulk.overview.collaboration.digestWorkspaceHealth.filter((item) => item.lastSweepQueuedAt).length >= 2,
      true
    );
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("admins can bulk assign owners across unhealthy workspaces in one environment", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceAlpha = "workspace_bulk_assign_alpha";
    const workspaceBeta = "workspace_bulk_assign_beta";

    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          {
            id: "admin",
            email: "admin@example.com",
            name: "Admin User",
            role: "admin",
            status: "active",
            workspaceId: workspaceAlpha,
            workspaceName: "Bulk Assign Alpha",
            createdAt: new Date().toISOString(),
          },
          {
            id: "beta-admin",
            email: "beta@example.com",
            name: "Beta Admin",
            role: "admin",
            status: "active",
            workspaceId: workspaceBeta,
            workspaceName: "Bulk Assign Beta",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      { action: "collaboration:digest-preferences", payload: { enabled: true, cadence: "daily", preferredChannel: "history" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: workspaceAlpha }
    );
    await handleConsoleRequest(
      { action: "collaboration:digest-preferences", payload: { enabled: true, cadence: "daily", preferredChannel: "history" } },
      { userId: "beta-admin", userName: "Beta Admin", userRole: "admin", workspaceId: workspaceBeta }
    );

    updateDigestWorkspaceState(workspaceAlpha, { lastSweepError: "Alpha failed." });
    updateDigestWorkspaceState(workspaceBeta, { lastSweepError: "Beta failed." });

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.environmentPolicies = { production: { trustDropAction: "notify" } };
    saveCollaborationState(collab);

    const assigned = await handleConsoleRequest(
      {
        action: "collaboration:automation-bulk-assign",
        payload: { environment: "production", statuses: ["error", "stalled"], owner: "Jamie Lead" },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: workspaceAlpha }
    );

    assert.equal(assigned.ok, true);
    assert.match(assigned.output, /Assigned Jamie Lead to 2 matching workspaces/i);
    assert.equal(
      assigned.overview.collaboration.digestWorkspaceHealth.filter((item) => item.escalationOwner === "Jamie Lead").length >= 2,
      true
    );
    assert.equal(
      assigned.overview.collaboration.digestWorkspaceHealth.every(
        (item) => item.workspaceId === workspaceAlpha || item.workspaceId === workspaceBeta ? item.incidentChecklist.some((entry) => entry.id === "owner_assigned" && entry.completed) : true
      ),
      true
    );
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("admins can bulk assign required approvers across unhealthy workspaces in one environment", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceAlpha = "workspace_bulk_approver_alpha";
    const workspaceBeta = "workspace_bulk_approver_beta";

    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          {
            id: "admin",
            email: "admin@example.com",
            name: "Admin User",
            role: "admin",
            status: "active",
            workspaceId: workspaceAlpha,
            workspaceName: "Bulk Approver Alpha",
            createdAt: new Date().toISOString(),
          },
          {
            id: "beta-admin",
            email: "beta@example.com",
            name: "Beta Admin",
            role: "admin",
            status: "active",
            workspaceId: workspaceBeta,
            workspaceName: "Bulk Approver Beta",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      { action: "collaboration:digest-preferences", payload: { enabled: true, cadence: "daily", preferredChannel: "history" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: workspaceAlpha }
    );
    await handleConsoleRequest(
      { action: "collaboration:digest-preferences", payload: { enabled: true, cadence: "daily", preferredChannel: "history" } },
      { userId: "beta-admin", userName: "Beta Admin", userRole: "admin", workspaceId: workspaceBeta }
    );

    updateDigestWorkspaceState(workspaceAlpha, { lastSweepError: "Alpha failed." });
    updateDigestWorkspaceState(workspaceBeta, { lastSweepError: "Beta failed." });

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.environmentPolicies = { production: { trustDropAction: "notify" } };
    saveCollaborationState(collab);

    const assigned = await handleConsoleRequest(
      {
        action: "collaboration:automation-bulk-assign-approver",
        payload: { environment: "production", statuses: ["error", "stalled"], approverTarget: "user:pat" },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: workspaceAlpha }
    );

    assert.equal(assigned.ok, true);
    assert.match(assigned.output, /Assigned user:pat as the incident approver for 2 matching workspaces/i);
    assert.equal(
      assigned.overview.collaboration.digestWorkspaceHealth.filter((item) => item.incidentApproverTarget === "user:pat").length >= 2,
      true
    );
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("admins can bulk assign backup approvers across unhealthy workspaces in one environment", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceAlpha = "workspace_bulk_backup_alpha";
    const workspaceBeta = "workspace_bulk_backup_beta";

    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          {
            id: "admin",
            email: "admin@example.com",
            name: "Admin User",
            role: "admin",
            status: "active",
            workspaceId: workspaceAlpha,
            workspaceName: "Bulk Backup Alpha",
            createdAt: new Date().toISOString(),
          },
          {
            id: "beta-admin",
            email: "beta@example.com",
            name: "Beta Admin",
            role: "admin",
            status: "active",
            workspaceId: workspaceBeta,
            workspaceName: "Bulk Backup Beta",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      { action: "collaboration:digest-preferences", payload: { enabled: true, cadence: "daily", preferredChannel: "history" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: workspaceAlpha }
    );
    await handleConsoleRequest(
      { action: "collaboration:digest-preferences", payload: { enabled: true, cadence: "daily", preferredChannel: "history" } },
      { userId: "beta-admin", userName: "Beta Admin", userRole: "admin", workspaceId: workspaceBeta }
    );

    updateDigestWorkspaceState(workspaceAlpha, { lastSweepError: "Alpha failed." });
    updateDigestWorkspaceState(workspaceBeta, { lastSweepError: "Beta failed." });

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.environmentPolicies = { production: { trustDropAction: "notify" } };
    saveCollaborationState(collab);

    const assigned = await handleConsoleRequest(
      {
        action: "collaboration:automation-bulk-assign-backup-approver",
        payload: { environment: "production", statuses: ["error", "stalled"], backupApproverTarget: "user:alex" },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: workspaceAlpha }
    );

    assert.equal(assigned.ok, true);
    assert.match(assigned.output, /Assigned user:alex as the backup incident approver for 2 matching workspaces/i);
    assert.equal(
      assigned.overview.collaboration.digestWorkspaceHealth.filter((item) => item.backupApproverTarget === "user:alex").length >= 2,
      true
    );
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("admins can run the stabilization playbook across unhealthy workspaces in one environment", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceAlpha = "workspace_bulk_stabilize_alpha";
    const workspaceBeta = "workspace_bulk_stabilize_beta";

    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          {
            id: "admin",
            email: "admin@example.com",
            name: "Admin User",
            role: "admin",
            status: "active",
            workspaceId: workspaceAlpha,
            workspaceName: "Bulk Stabilize Alpha",
            createdAt: new Date().toISOString(),
          },
          {
            id: "beta-admin",
            email: "beta@example.com",
            name: "Beta Admin",
            role: "admin",
            status: "active",
            workspaceId: workspaceBeta,
            workspaceName: "Bulk Stabilize Beta",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      { action: "collaboration:digest-preferences", payload: { enabled: true, cadence: "daily", preferredChannel: "history" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: workspaceAlpha }
    );
    await handleConsoleRequest(
      { action: "collaboration:digest-preferences", payload: { enabled: true, cadence: "daily", preferredChannel: "history" } },
      { userId: "beta-admin", userName: "Beta Admin", userRole: "admin", workspaceId: workspaceBeta }
    );

    updateDigestWorkspaceState(workspaceAlpha, { lastSweepError: "Alpha failed." });
    updateDigestWorkspaceState(workspaceBeta, { lastSweepError: "Beta failed." });

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.environmentPolicies = { production: { trustDropAction: "notify" } };
    saveCollaborationState(collab);

    const stabilized = await handleConsoleRequest(
      {
        action: "collaboration:automation-bulk-stabilize",
        payload: {
          environment: "production",
          statuses: ["error", "stalled"],
          owner: "Jamie Lead",
          approverTarget: "user:pat",
          backupApproverTarget: "user:alex",
          description: "Investigate automation health for {{workspaceName}}.",
          createFollowup: true,
          queueSweep: true,
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: workspaceAlpha }
    );

    assert.equal(stabilized.ok, true);
    assert.match(stabilized.output, /Stabilized 2 matching workspaces/i);
    assert.equal(
      stabilized.overview.collaboration.digestWorkspaceHealth.filter(
        (item) =>
          (item.workspaceId === workspaceAlpha || item.workspaceId === workspaceBeta) &&
          item.escalationOwner === "Jamie Lead" &&
          item.incidentApproverTarget === "user:pat" &&
          item.backupApproverTarget === "user:alex"
      ).length >= 2,
      true
    );
    assert.equal(
      loadQueue().tasks.filter(
        (item) =>
          (item.workspaceId === workspaceAlpha || item.workspaceId === workspaceBeta) &&
          item.ownerName === "Jamie Lead"
      ).length >= 2,
      true
    );
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("admins can bulk create follow-up tasks across unhealthy workspaces in one environment", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath) : null;

  try {
    resetState();
    const workspaceAlpha = "workspace_bulk_followup_alpha";
    const workspaceBeta = "workspace_bulk_followup_beta";

    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          {
            id: "admin",
            email: "admin@example.com",
            name: "Admin User",
            role: "admin",
            status: "active",
            workspaceId: workspaceAlpha,
            workspaceName: "Bulk Follow-up Alpha",
            createdAt: new Date().toISOString(),
          },
          {
            id: "beta-admin",
            email: "beta@example.com",
            name: "Beta Admin",
            role: "admin",
            status: "active",
            workspaceId: workspaceBeta,
            workspaceName: "Bulk Follow-up Beta",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      { action: "collaboration:digest-preferences", payload: { enabled: true, cadence: "daily", preferredChannel: "history" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: workspaceAlpha }
    );
    await handleConsoleRequest(
      { action: "collaboration:digest-preferences", payload: { enabled: true, cadence: "daily", preferredChannel: "history" } },
      { userId: "beta-admin", userName: "Beta Admin", userRole: "admin", workspaceId: workspaceBeta }
    );

    updateDigestWorkspaceState(workspaceAlpha, { lastSweepError: "Alpha failed." });
    updateDigestWorkspaceState(workspaceBeta, { lastSweepError: "Beta failed." });

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.environmentPolicies = { production: { trustDropAction: "notify" } };
    saveCollaborationState(collab);

    const created = await handleConsoleRequest(
      {
        action: "collaboration:automation-bulk-create-followup",
        payload: {
          environment: "production",
          statuses: ["error", "stalled"],
          owner: "Jamie Lead",
          description: "Investigate automation health for {{workspaceName}}.",
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: workspaceAlpha }
    );

    assert.equal(created.ok, true);
    assert.match(created.output, /Created 2 follow-up tasks/i);
    assert.equal(
      loadQueue().tasks.filter(
        (item) =>
          item.ownerName === "Jamie Lead" &&
          (item.workspaceId === workspaceAlpha || item.workspaceId === workspaceBeta)
      ).length >= 2,
      true
    );
    assert.equal(
      created.overview.collaboration.digestWorkspaceHealth.every(
        (item) => item.workspaceId === workspaceAlpha || item.workspaceId === workspaceBeta ? item.incidentChecklist.some((entry) => entry.id === "followup_created" && entry.completed) : true
      ),
      true
    );
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers);
    }
    restoreFiles(snapshot);
  }
});

test("admins can bulk apply and clear workspace policy overrides across matching workspaces", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const workspaceAlpha = "workspace_bulk_policy_alpha";
    const workspaceBeta = "workspace_bulk_policy_beta";

    updateDigestWorkspaceState(workspaceAlpha, {
      escalationOwner: "Jamie Lead",
      lastSweepError: "digest stalled",
      incidentStatus: "open",
    });
    updateDigestWorkspaceState(workspaceBeta, {
      escalationOwner: "Jamie Lead",
      lastSweepError: "digest stalled",
      incidentStatus: "open",
    });

    const applied = await handleConsoleRequest(
      {
        action: "collaboration:automation-bulk-apply-policy-override",
        payload: {
          environment: "development",
          statuses: ["idle"],
          overrideEnvironment: "production",
          requireApprovalForResolved: true,
          incidentApprovalCapacityLimit: 5,
          trustDropAction: "digest",
          promoteTrustDropToIncident: true,
        },
      },
      { userId: "admin-1", userName: "Admin User", userRole: "admin" }
    );

    assert.equal(applied.ok, true);
    assert.equal(applied.overview.collaboration.globalOperations.totals.overriddenWorkspaces >= 2, true);
    const appliedAlpha = applied.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceAlpha);
    assert.equal(appliedAlpha.hasPolicyOverride, true);
    assert.equal(appliedAlpha.incidentPolicy.environment, "production");
    assert.equal(appliedAlpha.incidentPolicy.incidentApprovalCapacityLimit, 5);

    const cleared = await handleConsoleRequest(
      {
        action: "collaboration:automation-bulk-reset-policy-override",
        payload: {
          environment: "production",
          statuses: ["idle"],
        },
      },
      { userId: "admin-1", userName: "Admin User", userRole: "admin" }
    );

    assert.equal(cleared.ok, true);
    const clearedAlpha = cleared.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceAlpha);
    assert.equal(clearedAlpha.hasPolicyOverride, false);
  } finally {
    restoreFiles(snapshot);
  }
});

test("admins can save, apply, and delete workspace policy playbooks", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const workspaceAlpha = "workspace_policy_playbook_alpha";
    const workspaceBeta = "workspace_policy_playbook_beta";

    updateDigestWorkspaceState(workspaceAlpha, {
      escalationOwner: "Jamie Lead",
      lastSweepError: "digest stalled",
      incidentStatus: "open",
    });
    updateDigestWorkspaceState(workspaceBeta, {
      escalationOwner: "Jamie Lead",
      lastSweepError: "digest stalled",
      incidentStatus: "open",
    });

    const saved = await handleConsoleRequest(
      {
        action: "collaboration:save-policy-playbook",
        payload: {
          name: "Strict production recovery",
          environment: "development",
          incidentApprovalCapacityLimit: 4,
          trustDropAction: "digest",
          requireApprovalForResolved: true,
          promoteTrustDropToIncident: true,
        },
      },
      { userId: "admin-1", userName: "Admin User", userRole: "admin" }
    );

    assert.equal(saved.ok, true);
    assert.equal(saved.overview.collaboration.governance.workspacePolicyPlaybooks.length >= 1, true);
    const playbook = saved.overview.collaboration.governance.workspacePolicyPlaybooks.find(
      (item) => item.name === "Strict production recovery"
    );
    assert.ok(playbook);
    assert.equal(playbook.incidentApprovalCapacityLimit, 4);

    const applied = await handleConsoleRequest(
      {
        action: "collaboration:automation-bulk-apply-policy-playbook",
        payload: {
          environment: "development",
          statuses: ["idle"],
          playbookId: playbook.id,
        },
      },
      { userId: "admin-1", userName: "Admin User", userRole: "admin" }
    );

    assert.equal(applied.ok, true);
    const appliedAlpha = applied.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceAlpha);
    assert.equal(appliedAlpha.hasPolicyOverride, true);
    assert.equal(appliedAlpha.incidentPolicy.incidentApprovalCapacityLimit, 4);
    assert.equal(appliedAlpha.incidentPolicy.requireApprovalForResolved, true);
    assert.equal(applied.overview.collaboration.globalOperations.totals.playbookRollouts >= 1, true);
    assert.equal(
      applied.overview.collaboration.globalOperations.playbookRollouts.some(
        (item) => item.playbookId === playbook.id && item.workspaceCount >= 2
      ),
      true
    );
    assert.equal(
      applied.overview.collaboration.governance.workspacePolicyPlaybookRollouts.some(
        (item) => item.playbookId === playbook.id && item.workspaceIds.includes(workspaceAlpha)
      ),
      true
    );

    const deleted = await handleConsoleRequest(
      {
        action: "collaboration:delete-policy-playbook",
        payload: {
          playbookId: playbook.id,
        },
      },
      { userId: "admin-1", userName: "Admin User", userRole: "admin" }
    );

    assert.equal(deleted.ok, true);
    assert.equal(
      deleted.overview.collaboration.governance.workspacePolicyPlaybooks.some((item) => item.id === playbook.id),
      false
    );
  } finally {
    restoreFiles(snapshot);
  }
});

test("operations overview exposes default policy playbook presets", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const result = await handleConsoleRequest(
      { command: "dashboard:system" },
      { userId: "admin-1", userName: "Admin User", userRole: "admin" }
    );

    assert.equal(result.ok, true);
    const presets = result.overview.collaboration.governance.defaultPolicyPlaybookPresets;
    assert.equal(Array.isArray(presets), true);
    assert.equal(presets.some((item) => item.environment === "production" && item.name === "Production Recovery"), true);
    assert.equal(presets.some((item) => item.environment === "staging" && item.name === "Staging Watch"), true);
  } finally {
    restoreFiles(snapshot);
  }
});

test("policy playbook adoption tracks preset and saved rollout usage", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const workspaceAlpha = "workspace_policy_adoption_alpha";
    const workspaceBeta = "workspace_policy_adoption_beta";

    updateDigestWorkspaceState(workspaceAlpha, {
      escalationOwner: "Jamie Lead",
      lastSweepError: "digest stalled",
      incidentStatus: "open",
    });
    updateDigestWorkspaceState(workspaceBeta, {
      escalationOwner: "Jamie Lead",
      lastSweepError: "digest stalled",
      incidentStatus: "open",
    });

    await handleConsoleRequest(
      {
        action: "collaboration:automation-bulk-apply-policy-override",
        payload: {
          environment: "staging",
          statuses: ["error", "stalled"],
          overrideEnvironment: "production",
          incidentApprovalCapacityLimit: 1,
          trustDropAction: "followup",
          requireApprovalForResolved: true,
          promoteTrustDropToIncident: true,
        },
      },
      { userId: "admin-1", userName: "Admin User", userRole: "admin" }
    );

    const saved = await handleConsoleRequest(
      {
        action: "collaboration:save-policy-playbook",
        payload: {
          name: "Saved staging recovery",
          environment: "staging",
          incidentApprovalCapacityLimit: 2,
          trustDropAction: "digest",
          requireApprovalForResolved: true,
          promoteTrustDropToIncident: false,
        },
      },
      { userId: "admin-1", userName: "Admin User", userRole: "admin" }
    );
    const playbook = saved.overview.collaboration.governance.workspacePolicyPlaybooks.find(
      (item) => item.name === "Saved staging recovery"
    );

    const applied = await handleConsoleRequest(
      {
        action: "collaboration:automation-bulk-apply-policy-playbook",
        payload: {
          environment: "production",
          statuses: ["error", "stalled"],
          playbookId: playbook.id,
        },
      },
      { userId: "admin-1", userName: "Admin User", userRole: "admin" }
    );

    const adoption = applied.overview.collaboration.policyPlaybookAdoption;
    assert.equal(adoption.totalTracked >= 1, true);
    assert.equal(adoption.savedCount >= 1, true);

    const savedEntry = adoption.items.find((item) => item.playbookId === playbook.id);
    assert.ok(savedEntry);
    assert.equal(savedEntry.source, "saved");
    assert.equal(savedEntry.rolloutCount >= 1, true);
  } finally {
    restoreFiles(snapshot);
  }
});
