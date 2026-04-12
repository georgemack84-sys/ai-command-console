/* eslint-disable @typescript-eslint/no-unused-vars */
// core compatibility for the legacy console compatibility shell.
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

test("console handler returns help output and records an audit event", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const result = await handleConsoleRequest({ command: "help" });

    assert.equal(result.ok, true);
    assert.match(result.output, /Available Commands/);
    assert.ok(Array.isArray(result.overview.activity));

    const events = listAuditEvents(1);
    assert.equal(events[0].type, "command");
    assert.match(events[0].message, /Executed console command/);
  } finally {
    restoreFiles(snapshot);
  }
});

test("workflow:create-task creates queue work through the same handler used by the route", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const result = await handleConsoleRequest({
      action: "workflow:create-task",
      payload: {
        agentName: "planner",
        description: "Map the release workflow",
        priority: 2,
      },
    });

    assert.equal(result.ok, true);
    assert.match(result.output, /Map the release workflow/);
    assert.ok(loadQueue().tasks.some((item) => item.description === "Map the release workflow"));

    const events = listAuditEvents(1);
    assert.equal(events[0].type, "workflow:create-task");
  } finally {
    restoreFiles(snapshot);
  }
});

test("console handler throws for unknown actions so the route can surface a 400", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    await assert.rejects(
      () => handleConsoleRequest({ action: "unknown:action", payload: {} }),
      /Unknown action/
    );
  } finally {
    restoreFiles(snapshot);
  }
});

test("agent:update-config persists safe profile changes and exposes them in the overview", async () => {
  const snapshot = snapshotFiles(FILES);
  const originalProfile = fs.existsSync(AGENT_PROFILE_PATH) ? fs.readFileSync(AGENT_PROFILE_PATH, "utf8") : null;

  try {
    resetState();
    const result = await handleConsoleRequest({
      action: "agent:update-config",
      payload: {
        agentName: "researcher",
        role: "Field researcher",
        defaultGoal: "Validate the most important open question.",
        maxStepsPerRun: 7,
        cooldownSeconds: 3,
        allowShellExecution: false,
        allowFileWrite: true,
        allowPlanning: true,
        tags: ["research", "field-test"],
      },
    }, { bypassApproval: true });

    assert.equal(result.ok, true);
    assert.match(result.output, /Updated profile/);

    const savedProfile = JSON.parse(fs.readFileSync(AGENT_PROFILE_PATH, "utf8"));
    assert.equal(savedProfile.role, "Field researcher");
    assert.equal(savedProfile.maxStepsPerRun, 7);
    assert.deepEqual(savedProfile.tags, ["research", "field-test"]);

    const agentDetail = result.overview.agentDetails.find((item) => item.agentName === "researcher");
    assert.equal(agentDetail.profile.role, "Field researcher");
    assert.equal(agentDetail.profile.defaultGoal, "Validate the most important open question.");
  } finally {
    if (originalProfile === null) {
      if (fs.existsSync(AGENT_PROFILE_PATH)) {
        fs.unlinkSync(AGENT_PROFILE_PATH);
      }
    } else {
      fs.writeFileSync(AGENT_PROFILE_PATH, originalProfile, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("watcher:rule-upsert saves watcher rules into overview state", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const result = await handleConsoleRequest({
      action: "watcher:rule-upsert",
      payload: {
        name: "research_escalation_rule",
        agentName: "researcher",
        minQueuedTasks: 2,
        scheduleIntervalSeconds: 6,
        scheduleMaxCycles: 4,
        enabled: true,
      },
    });

    assert.equal(result.ok, true);
    assert.match(result.output, /Saved watcher rule/);
    assert.ok(result.overview.watcher.rules.some((rule) => rule.name === "research_escalation_rule"));
  } finally {
    restoreFiles(snapshot);
  }
});

test("policy:update-thresholds and policy:update-automation persist automation settings", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const thresholdsResult = await handleConsoleRequest({
      action: "policy:update-thresholds",
      payload: {
        queuedTasksHigh: 9,
        pendingReviewsHigh: 7,
        inactiveAgentsHigh: 3,
      },
    }, { bypassApproval: true });

    assert.equal(thresholdsResult.ok, true);
    assert.equal(thresholdsResult.overview.automation.alertThresholds.queuedTasksHigh, 9);
    assert.equal(thresholdsResult.overview.automation.alertThresholds.pendingReviewsHigh, 7);

    const policyResult = await handleConsoleRequest({
      action: "policy:update-automation",
      payload: {
        escalation: {
          autoRunWatcherOnPolicySave: true,
          autoRunAlertsOnPolicySave: false,
          autoAcknowledgeWatcherStopped: true,
          preferredAlertOwner: "ops-lead",
        },
        remediation: {
          allowScheduleRestartRecommendations: false,
          allowAlertResolutionRecommendations: true,
          allowReviewFollowupRecommendations: false,
        },
      },
    }, { bypassApproval: true });

    assert.equal(policyResult.ok, true);
    assert.equal(policyResult.overview.automation.policy.escalation.autoRunWatcherOnPolicySave, true);
    assert.equal(policyResult.overview.automation.policy.escalation.preferredAlertOwner, "ops-lead");
    assert.equal(policyResult.overview.automation.policy.remediation.allowScheduleRestartRecommendations, false);
  } finally {
    restoreFiles(snapshot);
  }
});

test("workspace policy overrides change the live incident policy for that workspace", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
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
            workspaceId: "default",
            workspaceName: "Main Workspace",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );
    const current = loadCollaborationState();
    saveCollaborationState({
      ...current,
      governance: {
        ...current.governance,
        currentEnvironment: "development",
        workspacePolicyOverrides: {
          default: {
            environment: "production",
            requireApprovalForResolved: true,
            incidentApprovalCapacityLimit: 4,
            trustDropAction: "digest",
            promoteTrustDropToIncident: true,
          },
        },
      },
    });

    const result = await handleConsoleRequest({ command: "dashboard:system" });
    assert.equal(result.ok, true);
    const workspace = result.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === "default");
    assert.equal(workspace.incidentPolicy.environment, "production");
    assert.equal(workspace.incidentPolicy.requireApprovalForResolved, true);
    assert.equal(workspace.incidentPolicy.incidentApprovalCapacityLimit, 4);
    assert.equal(workspace.hasPolicyOverride, true);
    assert.match(workspace.policyOverrideSummary, /env production/);
    assert.equal(result.overview.collaboration.globalOperations.totals.overriddenWorkspaces, 1);
    assert.equal(result.overview.collaboration.globalOperations.hotspots[0].hasPolicyOverride, true);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("collaboration actions persist shared sessions and handoffs in overview state", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const shared = await handleConsoleRequest(
      {
        action: "collaboration:share-session",
        payload: {
          name: "Editorial Standup",
          draftCommand: "dashboard:health",
          macros: [{ name: "Health", command: "dashboard:health" }],
          sharedWith: ["team", "ops"],
        },
      },
      { userId: "alex", userName: "Alex Editor" }
    );

    assert.equal(shared.ok, true);
    assert.equal(shared.overview.collaboration.sharedSessions[0].name, "Editorial Standup");
    assert.equal(shared.overview.collaboration.sharedSessions[0].ownerName, "Alex Editor");

    const handoff = await handleConsoleRequest(
      {
        action: "collaboration:create-handoff",
        payload: {
          title: "Morning handoff",
          note: "Please triage the pending review queue first.",
          assignedTo: "ops-lead",
        },
      },
      { userId: "alex", userName: "Alex Editor" }
    );

    assert.equal(handoff.ok, true);
    assert.equal(handoff.overview.collaboration.handoffs[0].title, "Morning handoff");
    assert.equal(handoff.overview.collaboration.handoffs[0].assignedTo, "ops-lead");
  } finally {
    restoreFiles(snapshot);
  }
});

test("sensitive actions create approval requests until someone approves them", async () => {
  const snapshot = snapshotFiles(FILES);
  const originalProfile = fs.existsSync(AGENT_PROFILE_PATH) ? fs.readFileSync(AGENT_PROFILE_PATH, "utf8") : null;

  try {
    resetState();
    const baselineProfile = {
      ...(originalProfile ? JSON.parse(originalProfile) : { agentName: "researcher" }),
      role: "Baseline role",
    };
    fs.mkdirSync(path.dirname(AGENT_PROFILE_PATH), { recursive: true });
    fs.writeFileSync(AGENT_PROFILE_PATH, JSON.stringify(baselineProfile, null, 2), "utf8");

    const request = await handleConsoleRequest(
      {
        action: "agent:update-config",
        payload: {
          agentName: "researcher",
          role: "Needs approval",
        },
      },
      { userId: "alex", userName: "Alex Editor" }
    );

    assert.equal(request.ok, true);
    assert.match(request.output, /Approval requested/);
    assert.equal(request.overview.collaboration.approvals[0].status, "pending");

    const savedProfileBeforeApproval = JSON.parse(fs.readFileSync(AGENT_PROFILE_PATH, "utf8"));
    assert.notEqual(savedProfileBeforeApproval.role, "Needs approval");

    const approved = await handleConsoleRequest(
      {
        action: "approval:approve",
        payload: {
          approvalId: request.overview.collaboration.approvals[0].id,
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "approver" }
    );

    assert.equal(approved.ok, true);
    assert.match(approved.output, /Updated profile/);
    assert.equal(approved.overview.collaboration.approvals[0].status, "approved");

    const savedProfileAfterApproval = JSON.parse(fs.readFileSync(AGENT_PROFILE_PATH, "utf8"));
    assert.equal(savedProfileAfterApproval.role, "Needs approval");
  } finally {
    if (originalProfile === null) {
      if (fs.existsSync(AGENT_PROFILE_PATH)) {
        fs.unlinkSync(AGENT_PROFILE_PATH);
      }
    } else {
      fs.writeFileSync(AGENT_PROFILE_PATH, originalProfile, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("console actions emit telemetry summaries for operators", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    await handleConsoleRequest({ command: "help" }, { userId: "alex", userName: "Alex Editor" });
    await handleConsoleRequest(
      {
        action: "workflow:create-task",
        payload: {
          agentName: "planner",
          description: "Instrument telemetry coverage",
          priority: 2,
        },
      },
      { userId: "alex", userName: "Alex Editor" }
    );

    const telemetry = buildTelemetrySummary();
    assert.ok(telemetry.totals.events >= 2);
    assert.ok(telemetry.byType.some((item) => item.type === "command"));
    assert.ok(telemetry.byType.some((item) => item.type === "workflow:create-task"));
  } finally {
    restoreFiles(snapshot);
  }
});

test("heavy console actions queue background jobs and expose status in overview", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const queued = await handleConsoleRequest(
      { command: "watcher:run" },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );

    assert.equal(queued.ok, true);
    assert.match(queued.output, /Queued watcher run/);
    assert.equal(queued.overview.jobs.queued, 1);

    await runPendingJobs();

    const refreshed = await handleConsoleRequest(
      { command: "help" },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );
    assert.ok(refreshed.overview.jobs.items.some((job) => job.type === "watcher:run" && job.status === "completed"));
  } finally {
    restoreFiles(snapshot);
  }
});

test("report workflows can run through background jobs", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const brief = await handleConsoleRequest(
      {
        action: "brief:create",
        payload: {
          title: "Queued report brief",
          question: "What should be automated next?",
          assignedAgent: "researcher",
        },
      },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );

    const briefId = brief.output?.match(/ID: ([^\n]+)/)?.[1] || "";
    const queuedCreate = await handleConsoleRequest(
      {
        action: "report:create",
        payload: {
          briefId,
          title: "Queued memo",
          format: "memo",
          excerpt: "Queued creation",
          keyFindings: ["One", "Two"],
        },
      },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );

    assert.equal(queuedCreate.ok, true);
    assert.match(queuedCreate.output, /Queued report draft creation/);

    await runPendingJobs();

    const reportsOutput = await handleConsoleRequest(
      { command: "report:list" },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );
    assert.match(reportsOutput.output, /Queued memo/);
  } finally {
    restoreFiles(snapshot);
  }
});

test("queued jobs can be canceled and failed jobs can be retried", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const queuedJob = enqueueJob("watcher:run", {}, { actorId: "alex", actorName: "Alex Editor" });

    const canceled = await handleConsoleRequest(
      { action: "job:cancel", payload: { jobId: queuedJob.id } },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );
    assert.equal(canceled.ok, true);
    assert.ok(canceled.overview.jobs.items.some((job) => job.id === queuedJob.id && job.status === "canceled"));

    const failedJob = enqueueJob("plugin:run", { name: "missingPlugin" }, { actorId: "alex", actorName: "Alex Editor" });
    updateJob(failedJob.id, (current) => ({
      ...current,
      status: "failed",
      error: "Synthetic failure",
      completedAt: new Date().toISOString(),
    }));

    const retried = await handleConsoleRequest(
      { action: "job:retry", payload: { jobId: failedJob.id } },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );
    assert.equal(retried.ok, true);
    assert.ok(retried.overview.jobs.items.some((job) => job.id === failedJob.id && job.status === "queued"));
  } finally {
    restoreFiles(snapshot);
  }
});

test("failed jobs schedule automatic retry with backoff metadata", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    registerJobProcessor("test:failing-job", async () => {
      throw new Error("Synthetic processor failure");
    });
    const queuedJob = enqueueJob("test:failing-job", {}, { actorId: "alex", actorName: "Alex Editor", maxAttempts: 3, retryDelayMs: 50 });

    await runPendingJobs();

    const failedOverview = await handleConsoleRequest(
      { command: "help" },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );

    const scheduled = failedOverview.overview.jobs.items.find((job) => job.id === queuedJob.id);
    assert.equal(scheduled?.status, "scheduled_retry");
    assert.ok(scheduled?.nextRetryAt);

    updateJob(queuedJob.id, (current) => ({
      ...current,
      nextRetryAt: new Date(Date.now() - 1000).toISOString(),
    }));

    await runPendingJobs();

    const retriedOverview = await handleConsoleRequest(
      { command: "help" },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );
    const retried = retriedOverview.overview.jobs.items.find((job) => job.id === queuedJob.id);
    assert.ok((retried?.retryCount || 0) >= 1);
  } finally {
    restoreFiles(snapshot);
  }
});

test("job overview exposes worker health and throughput metrics", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    registerJobProcessor("test:success-job", async () => "ok");
    const successJob = enqueueJob("test:success-job", {}, { actorId: "alex", actorName: "Alex Editor" });
    const failingJob = enqueueJob("test:failing-job", {}, { actorId: "alex", actorName: "Alex Editor", maxAttempts: 2, retryDelayMs: 50 });

    updateJob(successJob.id, (current) => ({
      ...current,
      startedAt: new Date(Date.now() - 400).toISOString(),
      completedAt: new Date(Date.now() - 100).toISOString(),
      status: "completed",
      attempts: 1,
    }));

    updateJob(failingJob.id, (current) => ({
      ...current,
      status: "scheduled_retry",
      retryCount: 1,
      attempts: 1,
      nextRetryAt: new Date(Date.now() + 5000).toISOString(),
      error: "retrying",
    }));

    const overview = await handleConsoleRequest(
      { command: "help" },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );

    assert.ok(overview.overview.jobs.metrics.avgRunTimeMs >= 0);
    assert.ok(overview.overview.jobs.metrics.completionRate >= 0);
    assert.ok(overview.overview.jobs.metrics.retryPressure > 0);
    assert.equal(overview.overview.jobs.metrics.scheduledRetries, 1);
  } finally {
    restoreFiles(snapshot);
  }
});

test("jobs expose execution events for the operator drawer", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    registerJobProcessor("test:eventful-job", async (job) => {
      job.log("Processor picked up the work item.", { phase: "start" });
      job.log("Processor finished the work item.", { phase: "finish" });
      return { ok: true, summary: "done" };
    });

    enqueueJob("test:eventful-job", { sample: true }, { actorId: "alex", actorName: "Alex Editor" });
    await runPendingJobs();

    const overview = await handleConsoleRequest(
      { command: "help" },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );

    const job = overview.overview.jobs.items.find((item) => item.type === "test:eventful-job");
    assert.ok(job);
    assert.ok(Array.isArray(job.events));
    assert.ok(job.events.length >= 4);
    assert.ok(job.events.some((event) => event.message.includes("Job queued")));
    assert.ok(job.events.some((event) => event.message.includes("Processor picked up")));
    assert.ok(job.events.some((event) => event.message.includes("completed successfully")));
  } finally {
    restoreFiles(snapshot);
  }
});

test("job detail returns fuller history than the overview summary", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    registerJobProcessor("test:detailed-job", async (job) => {
      job.log("one");
      job.log("two");
      job.log("three");
      job.log("four");
      job.log("five");
      job.log("six");
      job.log("seven");
      return "ok";
    });

    const queuedJob = enqueueJob("test:detailed-job", {}, { actorId: "alex", actorName: "Alex Editor" });
    await runPendingJobs();

    const overview = await handleConsoleRequest(
      { command: "help" },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );
    const summaryJob = overview.overview.jobs.items.find((item) => item.id === queuedJob.id);
    assert.ok(summaryJob);
    assert.ok((summaryJob.eventCount || 0) > (summaryJob.events?.length || 0));

    const detail = await handleConsoleRequest(
      { action: "job:detail", payload: { jobId: queuedJob.id } },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );

    assert.equal(detail.ok, true);
    assert.equal(detail.detail?.job?.id, queuedJob.id);
    assert.ok((detail.detail?.job?.events?.length || 0) >= 9);
  } finally {
    restoreFiles(snapshot);
  }
});

test("users in the same workspace share research desk state", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const sharedWorkspace = "workspace_team_alpha";

    const created = await handleConsoleRequest(
      {
        action: "brief:create",
        payload: {
          title: "Workspace brief",
          question: "What should the whole team see?",
          assignedAgent: "researcher",
        },
      },
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId: sharedWorkspace }
    );

    assert.equal(created.ok, true);

    const listed = await handleConsoleRequest(
      { command: "brief:list" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "approver", workspaceId: sharedWorkspace }
    );

    assert.match(listed.output, /Workspace brief/);
  } finally {
    restoreFiles(snapshot);
  }
});
