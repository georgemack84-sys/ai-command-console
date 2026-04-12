/* eslint-disable @typescript-eslint/no-unused-vars */
// collaboration compatibility for the legacy console compatibility shell.
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
  saveWorkspaceRoutesStore,
  saveWorkspaceBriefStore,
  saveWorkspaceReportStore,
  resetState,
  snapshotFiles,
  restoreFiles,
} from "./helpers/legacy-console-fixture.mjs";

test("workspace ownership signals appear in overview and command output", async () => {
  const snapshot = snapshotFiles(FILES);
  const originalRoutes = fs.existsSync(ROUTES_STORE_PATH) ? fs.readFileSync(ROUTES_STORE_PATH, "utf8") : null;
  const originalBriefs = fs.existsSync(BRIEFS_STORE_PATH) ? fs.readFileSync(BRIEFS_STORE_PATH, "utf8") : null;
  const originalReports = fs.existsSync(REPORTS_STORE_PATH) ? fs.readFileSync(REPORTS_STORE_PATH, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_signal_test";

    saveWorkspaceBriefStore({
      [workspaceId]: [
        { id: "brief_1", title: "Orphaned brief", question: "Who owns this?", status: "draft", priority: "medium", assignedAgent: "researcher", tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), summary: "orphaned", linkedTaskId: null },
      ],
    });
    saveWorkspaceReportStore({
      [workspaceId]: [
        { id: "report_1", briefId: "brief_1", title: "Owned report", format: "memo", status: "draft", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ownerId: "alex", ownerName: "Alex", excerpt: "owned", keyFindings: [] },
      ],
    });
    saveWorkspaceRoutesStore({
      [workspaceId]: [
        { id: "route_1", label: "North loop", route: "north", origin: "A", destination: "B", ownerId: "alex", ownerName: "Alex" },
        { id: "route_2", label: "South loop", route: "south", origin: "C", destination: "D", ownerId: "alex", ownerName: "Alex" },
        { id: "route_3", label: "East loop", route: "east", origin: "E", destination: "F", ownerId: "alex", ownerName: "Alex" },
      ],
    });

    const overview = await handleConsoleRequest(
      { command: "help" },
      { userId: "alex", userName: "Alex Editor", userRole: "admin", workspaceId }
    );

    assert.ok(overview.overview.ownershipSignals.some((item) => item.id === "ownership:orphaned"));
    assert.ok(overview.overview.ownershipSignals.some((item) => item.id === "ownership:imbalance"));
    assert.ok(overview.overview.recommendations.some((item) => item.command === "ownership:signals"));

    const detail = await handleConsoleRequest(
      { command: "ownership:signals" },
      { userId: "alex", userName: "Alex Editor", userRole: "admin", workspaceId }
    );

    assert.match(detail.output, /workspace items are unassigned/i);
    assert.match(detail.output, /carrying most of the workspace load/i);
  } finally {
    if (originalRoutes === null) {
      if (fs.existsSync(ROUTES_STORE_PATH)) fs.unlinkSync(ROUTES_STORE_PATH);
    } else {
      fs.writeFileSync(ROUTES_STORE_PATH, originalRoutes, "utf8");
    }
    if (originalBriefs === null) {
      if (fs.existsSync(BRIEFS_STORE_PATH)) fs.unlinkSync(BRIEFS_STORE_PATH);
    } else {
      fs.writeFileSync(BRIEFS_STORE_PATH, originalBriefs, "utf8");
    }
    if (originalReports === null) {
      if (fs.existsSync(REPORTS_STORE_PATH)) fs.unlinkSync(REPORTS_STORE_PATH);
    } else {
      fs.writeFileSync(REPORTS_STORE_PATH, originalReports, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("operator inbox aggregates ownership signals, handoffs, and approvals", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const workspaceId = "workspace_inbox_test";

    const request = await handleConsoleRequest(
      {
        action: "agent:update-config",
        payload: {
          agentName: "researcher",
          role: "Needs approval",
        },
      },
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );

    await handleConsoleRequest(
      {
        action: "collaboration:create-handoff",
        payload: {
          title: "Review ownership gaps",
          note: "Please rebalance the research desk before standup.",
          assignedTo: "team",
        },
      },
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );

    saveWorkspaceBriefStore({
      [workspaceId]: [
        { id: "brief_orphaned", title: "Unowned brief", question: "Who should own it?", status: "draft", priority: "medium", assignedAgent: "researcher", tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), summary: "orphaned", linkedTaskId: null },
      ],
    });

    const adminView = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.ok(adminView.overview.collaboration.inbox.some((item) => item.type === "ownership"));
    assert.ok(adminView.overview.collaboration.inbox.some((item) => item.type === "handoff"));
    assert.ok(adminView.overview.collaboration.inbox.some((item) => item.type === "approval"));

    const inboxOutput = await handleConsoleRequest(
      { command: "inbox:list" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.equal(request.ok, true);
    assert.match(inboxOutput.output, /operator inbox/i);
    assert.match(inboxOutput.output, /\[ownership\]/i);
    assert.match(inboxOutput.output, /\[handoff\]/i);
    assert.match(inboxOutput.output, /\[approval\]/i);
  } finally {
    restoreFiles(snapshot);
  }
});

test("inbox items can be marked read and acknowledged per user", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const workspaceId = "workspace_inbox_state_test";

    saveWorkspaceBriefStore({
      [workspaceId]: [
        { id: "brief_unowned", title: "Unowned brief", question: "Who owns this?", status: "draft", priority: "medium", assignedAgent: "researcher", tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), summary: "orphaned", linkedTaskId: null },
      ],
    });

    const before = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const inboxItem = before.overview.collaboration.inbox.find((item) => item.type === "ownership");
    assert.ok(inboxItem);
    assert.equal(inboxItem.read, false);
    assert.equal(inboxItem.acknowledged, false);

    const marked = await handleConsoleRequest(
      { action: "collaboration:inbox-mark-read", payload: { itemId: inboxItem.id } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const afterRead = marked.overview.collaboration.inbox.find((item) => item.id === inboxItem.id);
    assert.equal(afterRead?.read, true);
    assert.equal(afterRead?.acknowledged, false);

    const acknowledged = await handleConsoleRequest(
      { action: "collaboration:inbox-acknowledge", payload: { itemId: inboxItem.id } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const afterAck = acknowledged.overview.collaboration.inbox.find((item) => item.id === inboxItem.id);
    assert.equal(afterAck?.read, true);
    assert.equal(afterAck?.acknowledged, true);

    const otherUser = await handleConsoleRequest(
      { command: "help" },
      { userId: "alex", userName: "Alex Editor", userRole: "admin", workspaceId }
    );
    const otherInboxItem = otherUser.overview.collaboration.inbox.find((item) => item.id === inboxItem.id);
    assert.equal(otherInboxItem?.read, false);
    assert.equal(otherInboxItem?.acknowledged, false);
  } finally {
    restoreFiles(snapshot);
  }
});

test("notification history keeps handled inbox items after live sources clear", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const workspaceId = "workspace_notification_history_test";

    saveWorkspaceBriefStore({
      [workspaceId]: [
        { id: "brief_history", title: "History brief", question: "Will this remain visible?", status: "draft", priority: "medium", assignedAgent: "researcher", tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), summary: "orphaned", linkedTaskId: null },
      ],
    });

    const overview = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const inboxItem = overview.overview.collaboration.inbox.find((item) => item.type === "ownership");
    assert.ok(inboxItem);

    const acknowledged = await handleConsoleRequest(
      { action: "collaboration:inbox-acknowledge", payload: { itemId: inboxItem.id } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    assert.ok(acknowledged.overview.collaboration.notificationHistory.some((item) => item.id === inboxItem.id && item.acknowledged));

    saveWorkspaceBriefStore({ [workspaceId]: [] });

    const refreshed = await handleConsoleRequest(
      { command: "inbox:history" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.match(refreshed.output, /notification history/i);
    assert.match(refreshed.output, /workspace items are unassigned/i);
    assert.match(refreshed.output, /acknowledged/i);
  } finally {
    restoreFiles(snapshot);
  }
});

test("inbox routing respects explicit teammate targets and digest counts", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const workspaceId = "workspace_target_routing_test";

    await handleConsoleRequest(
      {
        action: "collaboration:create-handoff",
        payload: {
          title: "Direct handoff",
          note: "This one is for Alex specifically.",
          assignedTo: "user:alex,team",
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const alexView = await handleConsoleRequest(
      { command: "inbox:digest" },
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );
    assert.match(alexView.output, /Notification digest/i);
    assert.match(alexView.output, /Open: 1/i);
    assert.match(alexView.output, /Handoffs: 1/i);

    const samView = await handleConsoleRequest(
      { command: "inbox:digest" },
      { userId: "sam", userName: "Sam Writer", userRole: "operator", workspaceId }
    );
    assert.match(samView.output, /Open: 1/i);

    const namedOnly = await handleConsoleRequest(
      {
        action: "collaboration:create-handoff",
        payload: {
          title: "Named handoff",
          note: "This should only match Jamie by name.",
          assignedTo: "name:jamie lead",
        },
      },
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );
    assert.equal(namedOnly.ok, true);

    const jamieInbox = await handleConsoleRequest(
      { command: "inbox:list" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    assert.match(jamieInbox.output, /Named handoff/i);

    const alexInbox = await handleConsoleRequest(
      { command: "inbox:list" },
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );
    assert.doesNotMatch(alexInbox.output, /Named handoff/i);
  } finally {
    restoreFiles(snapshot);
  }
});

test("digest preferences persist and digest runs capture notification summaries", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const workspaceId = "workspace_digest_test";

    saveWorkspaceBriefStore({
      [workspaceId]: [
        { id: "brief_digest", title: "Digest brief", question: "Should appear in digest", status: "draft", priority: "medium", assignedAgent: "researcher", tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), summary: "orphaned", linkedTaskId: null },
      ],
    });

    const savedPreferences = await handleConsoleRequest(
      {
        action: "collaboration:digest-preferences",
        payload: {
          enabled: true,
          cadence: "daily",
          preferredChannel: "history",
          includeTrustReport: true,
          trustAudience: "admins",
          immediateOnTrustDrop: true,
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.equal(savedPreferences.ok, true);
    assert.equal(savedPreferences.overview.collaboration.digestPreferences.enabled, true);
    assert.equal(savedPreferences.overview.collaboration.digestPreferences.cadence, "daily");
    assert.equal(savedPreferences.overview.collaboration.digestPreferences.includeTrustReport, true);
    assert.equal(savedPreferences.overview.collaboration.digestPreferences.trustAudience, "admins");
    assert.equal(savedPreferences.overview.collaboration.digestPreferences.immediateOnTrustDrop, true);

    const generated = await handleConsoleRequest(
      { action: "collaboration:digest-generate", payload: {} },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.equal(generated.ok, true);
    assert.ok(generated.overview.collaboration.digestRuns.length >= 1);
    assert.match(generated.overview.collaboration.digestRuns[0].summary, /Environment trust recap/i);
    assert.ok(generated.overview.collaboration.digestRuns[0].highlights.some((item) => item.includes("workspace items are unassigned")));
    assert.equal(generated.overview.collaboration.digestRuns[0].reportType, "trust");
    assert.match(generated.overview.collaboration.digestRuns[0].report || "", /Trust report/i);
  } finally {
    restoreFiles(snapshot);
  }
});
