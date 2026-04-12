/* eslint-disable @typescript-eslint/no-unused-vars */
// trust and approval compatibility for the legacy console compatibility shell.
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

test("policy playbook adoption summarizes recovery outcomes for rolled out workspaces", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const workspaceId = "workspace_policy_outcome_alpha";

    updateDigestWorkspaceState(workspaceId, {
      escalationOwner: "Jamie Lead",
      lastSweepError: "digest stalled",
      incidentStatus: "open",
    });

    const saved = await handleConsoleRequest(
      {
        action: "collaboration:save-policy-playbook",
        payload: {
          name: "Outcome recovery bundle",
          environment: "development",
          incidentApprovalCapacityLimit: 2,
          trustDropAction: "digest",
          requireApprovalForResolved: true,
          promoteTrustDropToIncident: false,
        },
      },
      { userId: "admin-1", userName: "Admin User", userRole: "admin" }
    );
    const playbook = saved.overview.collaboration.governance.workspacePolicyPlaybooks.find(
      (item) => item.name === "Outcome recovery bundle"
    );

    await handleConsoleRequest(
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

    updateDigestWorkspaceState(workspaceId, {
      lastSweepError: null,
      incidentStatus: "resolved",
      lastSweepRunAt: new Date().toISOString(),
    });

    const overview = await handleConsoleRequest(
      { command: "dashboard:system" },
      { userId: "admin-1", userName: "Admin User", userRole: "admin" }
    );

    const adoption = overview.overview.collaboration.policyPlaybookAdoption.items.find(
      (item) => item.playbookId === playbook.id
    );
    assert.ok(adoption);
    assert.equal(adoption.recoveredWorkspaceCount >= 1, true);
    assert.equal(
      adoption.recoveredWorkspaceCount + adoption.activeRiskWorkspaceCount >= adoption.workspaceCount,
      true
    );
    assert.equal(
      overview.overview.collaboration.policyPlaybookAdoption.recommendations.some(
        (item) => item.playbookId === playbook.id
      ),
      true
    );
  } finally {
    restoreFiles(snapshot);
  }
});

test("policy playbook adoption flags risky rollout bundles for review", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const workspaceId = "workspace_policy_outcome_risk";

    updateDigestWorkspaceState(workspaceId, {
      escalationOwner: "Jamie Lead",
      lastSweepError: "digest stalled",
      incidentStatus: "open",
    });

    const saved = await handleConsoleRequest(
      {
        action: "collaboration:save-policy-playbook",
        payload: {
          name: "Risky staging bundle",
          environment: "development",
          incidentApprovalCapacityLimit: 2,
          trustDropAction: "digest",
          requireApprovalForResolved: true,
          promoteTrustDropToIncident: false,
        },
      },
      { userId: "admin-1", userName: "Admin User", userRole: "admin" }
    );
    const playbook = saved.overview.collaboration.governance.workspacePolicyPlaybooks.find(
      (item) => item.name === "Risky staging bundle"
    );

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

    assert.equal(
      applied.overview.collaboration.policyPlaybookAdoption.recommendations.some(
        (item) => item.playbookId === playbook.id && item.kind === "review"
      ),
      true
    );
  } finally {
    restoreFiles(snapshot);
  }
});

test("sharp trust drops can trigger immediate admin trust digests", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_trust_digest_drop_test";

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
            workspaceId,
            workspaceName: "Trust Drop Workspace",
            createdAt: new Date().toISOString(),
          },
          {
            id: "alex",
            email: "alex@example.com",
            name: "Alex Operator",
            role: "operator",
            status: "active",
            workspaceId,
            workspaceName: "Trust Drop Workspace",
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
          includeTrustReport: true,
          trustAudience: "admins",
          immediateOnTrustDrop: true,
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.appliedApprovalPolicies = [
      {
        id: "policy_regressed",
        recommendationId: "approval-policy-pressure:user:pat",
        recommendationKind: "capacity",
        environment: "production",
        title: "Reduce load on user:pat",
        appliedAt: new Date().toISOString(),
        appliedByName: "Jamie Lead",
        effectSummary: "Reduced load on pat.",
        impact: { status: "regressed", summary: "Approval latency regressed." },
      },
    ];
    collab.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 85,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(collab);

    const queued = queueDueDigestSweepIfNeeded(workspaceId, { actorId: "system", actorName: "System" });
    assert.ok(queued?.id);
    await runPendingJobs();

    const jamieRuns = listDigestRuns("jamie");
    assert.equal(jamieRuns.length >= 1, true);
    assert.equal(jamieRuns[0].reportType, "trust");
    assert.match(jamieRuns[0].report || "", /Trust report/i);

    const alexRuns = listDigestRuns("alex");
    assert.equal(alexRuns.length, 0);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("immediate trust digests respect the subscribed trust environment", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_trust_digest_environment_scope_test";

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
            workspaceId,
            workspaceName: "Scoped Trust Drop Workspace",
            createdAt: new Date().toISOString(),
          },
          {
            id: "sam",
            email: "sam@example.com",
            name: "Sam Lead",
            role: "admin",
            status: "active",
            workspaceId,
            workspaceName: "Scoped Trust Drop Workspace",
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
          includeTrustReport: true,
          trustAudience: "admins",
          trustEnvironment: "production",
          immediateOnTrustDrop: true,
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    await handleConsoleRequest(
      {
        action: "collaboration:digest-preferences",
        payload: {
          enabled: true,
          cadence: "daily",
          preferredChannel: "history",
          includeTrustReport: true,
          trustAudience: "admins",
          trustEnvironment: "staging",
          immediateOnTrustDrop: true,
        },
      },
      { userId: "sam", userName: "Sam Lead", userRole: "admin", workspaceId }
    );

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.appliedApprovalPolicies = [
      {
        id: "policy_regressed_env_scope",
        recommendationId: "approval-policy-pressure:user:pat",
        recommendationKind: "capacity",
        environment: "production",
        title: "Reduce load on user:pat",
        appliedAt: new Date().toISOString(),
        appliedByName: "Jamie Lead",
        effectSummary: "Reduced load on pat.",
        impact: { status: "regressed", summary: "Approval latency regressed." },
      },
    ];
    collab.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 85,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(collab);

    const queued = queueDueDigestSweepIfNeeded(workspaceId, { actorId: "system", actorName: "System" });
    assert.ok(queued?.id);
    await runPendingJobs();

    const jamieRuns = listDigestRuns("jamie");
    assert.equal(jamieRuns.length >= 1, true);
    assert.match(jamieRuns[0].summary || "", /Environment trust recap \(production\)/i);

    const samRuns = listDigestRuns("sam");
    assert.equal(samRuns.length, 0);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("trust drop escalation policy can create a follow-up task instead of a digest", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_trust_drop_followup_test";

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
            workspaceId,
            workspaceName: "Trust Follow-up Workspace",
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
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
          environmentPolicies: {
            production: {
              trustDropAction: "followup",
              trustDropFollowupOwner: "Jamie Lead",
            },
          },
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId, bypassApproval: true }
    );

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.appliedApprovalPolicies = [
      {
        id: "policy_regressed_followup",
        recommendationId: "approval-policy-pressure:user:pat",
        recommendationKind: "capacity",
        environment: "production",
        title: "Reduce load on user:pat",
        appliedAt: new Date().toISOString(),
        appliedByName: "Jamie Lead",
        effectSummary: "Reduced load on pat.",
        impact: { status: "regressed", summary: "Approval latency regressed." },
      },
    ];
    collab.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 90,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(collab);

    const queued = queueDueDigestSweepIfNeeded(workspaceId, { actorId: "system", actorName: "System" });
    assert.equal(queued, null);

    const tasks = loadQueue().tasks.filter((item) =>
      String(item.workspaceId || item.linkedWorkspaceId || "") === workspaceId &&
      String(item.description || "").includes("trust drop")
    );
    assert.equal(tasks.length >= 1, true);

    const jamieRuns = listDigestRuns("jamie");
    assert.equal(jamieRuns.length, 0);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("trust drops can be promoted into workspace incidents", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_trust_incident_test";

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
            workspaceId,
            workspaceName: "Trust Incident Workspace",
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
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
          environmentPolicies: {
            production: {
              promoteTrustDropToIncident: true,
              trustDropAction: "notify",
            },
          },
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId, bypassApproval: true }
    );

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.appliedApprovalPolicies = [
      {
        id: "policy_regressed_incident",
        recommendationId: "approval-policy-pressure:user:pat",
        recommendationKind: "capacity",
        environment: "production",
        title: "Reduce load on user:pat",
        appliedAt: new Date().toISOString(),
        appliedByName: "Jamie Lead",
        effectSummary: "Reduced load on pat.",
        impact: { status: "regressed", summary: "Approval latency regressed." },
      },
    ];
    collab.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 88,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(collab);

    const overview = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const workspaceHealth = overview.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(workspaceHealth?.incidentStatus, "open");
    assert.equal(
      workspaceHealth?.events?.some((event) => event.type === "trust-incident-promoted"),
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

test("trust digests include completed trust incidents when a trust lifecycle is archived", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_completed_trust_digest_test";

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
            workspaceId,
            workspaceName: "Completed Trust Digest Workspace",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    updateDigestWorkspaceState(workspaceId, {
      incidentStatus: "archived",
      incidentSummary: "Trust incident archived for Completed Trust Digest Workspace. Recovery, closeout, and archive are complete.",
      incidentSummaryUpdatedAt: new Date().toISOString(),
      events: [
        {
          id: "event_completed_trust_archived",
          type: "trust-incident-archived",
          message: "Archived the completed trust incident and finalized the recap.",
          actorId: "system",
          actorName: "System",
          note: "Trust incident archived for Completed Trust Digest Workspace.",
          timestamp: new Date().toISOString(),
        },
      ],
    });

    const preferences = await handleConsoleRequest(
      {
        action: "collaboration:digest-preferences",
        payload: {
          enabled: true,
          cadence: "daily",
          preferredChannel: "history",
          includeTrustReport: true,
          trustAudience: "admins",
          immediateOnTrustDrop: false,
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    assert.equal(preferences.overview.collaboration.digestPreferences.includeTrustReport, true);

    const generated = await handleConsoleRequest(
      { action: "collaboration:digest-generate", payload: {} },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.equal(generated.overview.collaboration.digestRuns[0].reportType, "trust");
    assert.match(generated.overview.collaboration.digestRuns[0].summary || "", /Environment trust recap/i);
    assert.match(generated.overview.collaboration.digestRuns[0].report || "", /Completed trust incidents/);
    assert.match(generated.overview.collaboration.digestRuns[0].report || "", /Environment recaps/);
    assert.match(generated.overview.collaboration.digestRuns[0].report || "", /Completed trust by environment/);
    assert.match(generated.overview.collaboration.digestRuns[0].report || "", /Completed Trust Digest Workspace/);
    assert.match(generated.overview.collaboration.digestRuns[0].report || "", /development: score 70, active trust 0, completed archived 1/i);
    assert.ok(
      generated.overview.collaboration.digestRuns[0].highlights.some((item) =>
        String(item).includes("Env development: score 70")
      )
    );
    assert.ok(
      generated.overview.collaboration.digestRuns[0].highlights.some((item) =>
        String(item).includes("Trust complete: Completed Trust Digest Workspace")
      )
    );
    assert.match(generated.overview.collaboration.digestRuns[0].report || "", /development: 1 archived trust incidents/i);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("trust digest preferences can scope trust recaps to a single environment", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_scoped_trust_digest_test";

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
            workspaceId,
            workspaceName: "Scoped Trust Digest Workspace",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    updateDigestWorkspaceState(workspaceId, {
      incidentStatus: "archived",
      incidentSummary: "Trust incident archived for Scoped Trust Digest Workspace.",
      incidentSummaryUpdatedAt: new Date().toISOString(),
      events: [
        {
          id: "event_scoped_trust_archived",
          type: "trust-incident-archived",
          message: "Archived the completed trust incident and finalized the recap.",
          actorId: "system",
          actorName: "System",
          note: "Trust incident archived for Scoped Trust Digest Workspace.",
          timestamp: new Date().toISOString(),
        },
      ],
    });

    await handleConsoleRequest(
      {
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId, bypassApproval: true }
    );

    const preferences = await handleConsoleRequest(
      {
        action: "collaboration:digest-preferences",
        payload: {
          enabled: true,
          cadence: "daily",
          preferredChannel: "history",
          includeTrustReport: true,
          trustAudience: "admins",
          trustEnvironment: "production",
          immediateOnTrustDrop: false,
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    assert.equal(preferences.overview.collaboration.digestPreferences.trustEnvironment, "production");

    const generated = await handleConsoleRequest(
      { action: "collaboration:digest-generate", payload: {} },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.match(generated.overview.collaboration.digestRuns[0].summary || "", /Environment trust recap \(production\)/i);
    assert.match(generated.overview.collaboration.digestRuns[0].report || "", /production: score 70, active trust 0, completed archived 1/i);
    assert.doesNotMatch(generated.overview.collaboration.digestRuns[0].report || "", /development:/i);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("recovered trust incidents move into ready_for_closeout with a trust summary", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_trust_incident_recovery_test";

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
            workspaceId,
            workspaceName: "Trust Incident Recovery Workspace",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.environmentPolicies = {
      ...(collab.governance.environmentPolicies || {}),
      production: {
        ...(collab.governance.environmentPolicies?.production || {}),
        promoteTrustDropToIncident: true,
        trustDropAction: "notify",
      },
    };
    collab.governance.appliedApprovalPolicies = [
      {
        id: "policy_regressed_recovery",
        recommendationId: "approval-policy-pressure:user:pat",
        recommendationKind: "capacity",
        environment: "production",
        title: "Reduce load on user:pat",
        appliedAt: new Date().toISOString(),
        appliedByName: "Jamie Lead",
        effectSummary: "Reduced load on pat.",
        impact: { status: "regressed", summary: "Approval latency regressed." },
      },
    ];
    collab.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 88,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(collab);

    const promoted = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const promotedWorkspace = promoted.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(promotedWorkspace?.incidentStatus, "open");

    const recoveredState = loadCollaborationState();
    recoveredState.governance.appliedApprovalPolicies = recoveredState.governance.appliedApprovalPolicies.map((item) => ({
      ...item,
      impact: { status: "improved", summary: "Approval latency recovered." },
    }));
    recoveredState.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 50,
        regressedCount: 2,
        improvedCount: 0,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 2,
      },
      {
        environment: "production",
        takenAt: new Date().toISOString(),
        score: 82,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(recoveredState);

    const recovered = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const recoveredWorkspace = recovered.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(recoveredWorkspace?.incidentStatus, "ready_for_closeout");
    assert.match(recoveredWorkspace?.incidentSummary || "", /Trust recovery detected/i);
    assert.equal(
      recoveredWorkspace?.events?.some((event) => event.type === "trust-incident-recovered"),
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

test("recovered trust incidents can auto-request governed closeout approval when ready", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_trust_incident_closeout_request_test";

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
            workspaceId,
            workspaceName: "Trust Incident Closeout Workspace",
            createdAt: new Date().toISOString(),
          },
          {
            id: "pat",
            email: "pat@example.com",
            name: "Pat Approver",
            role: "approver",
            status: "active",
            workspaceId,
            workspaceName: "Trust Incident Closeout Workspace",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.environmentPolicies = {
      ...(collab.governance.environmentPolicies || {}),
      production: {
        ...(collab.governance.environmentPolicies?.production || {}),
        promoteTrustDropToIncident: true,
        trustDropAction: "notify",
        requireApprovalForResolved: true,
        requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
      },
    };
    collab.governance.appliedApprovalPolicies = [
      {
        id: "policy_regressed_recovery_closeout",
        recommendationId: "approval-policy-pressure:user:pat",
        recommendationKind: "capacity",
        environment: "production",
        title: "Reduce load on user:pat",
        appliedAt: new Date().toISOString(),
        appliedByName: "Jamie Lead",
        effectSummary: "Reduced load on pat.",
        impact: { status: "regressed", summary: "Approval latency regressed." },
      },
    ];
    collab.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 88,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(collab);

    const promoted = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const promotedWorkspace = promoted.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(promotedWorkspace?.incidentStatus, "open");

    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: "Investigate trust recovery readiness." } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const recoveredState = loadCollaborationState();
    recoveredState.governance.appliedApprovalPolicies = recoveredState.governance.appliedApprovalPolicies.map((item) => ({
      ...item,
      impact: { status: "improved", summary: "Approval latency recovered." },
    }));
    recoveredState.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 50,
        regressedCount: 2,
        improvedCount: 0,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 2,
      },
      {
        environment: "production",
        takenAt: new Date().toISOString(),
        score: 82,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(recoveredState);

    const recovered = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const recoveredWorkspace = recovered.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    const pendingApproval = recovered.overview.collaboration.approvals.find(
      (item) =>
        item.status === "pending" &&
        item.action === "collaboration:automation-set-status" &&
        item.payload?.workspaceId === workspaceId &&
        item.payload?.incidentStatus === "resolved"
    );

    assert.equal(recoveredWorkspace?.incidentStatus, "ready_for_closeout");
    assert.equal(recoveredWorkspace?.incidentChecklist?.find((item) => item.id === "summary_generated")?.completed, true);
    assert.ok(pendingApproval);
    assert.equal(
      recoveredWorkspace?.events?.some((event) => event.message === "Automatically requested closeout approval after trust recovery."),
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

test("approved trust recovery closeout refreshes the summary with archive guidance", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_trust_incident_closeout_finalize_test";

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
            workspaceId,
            workspaceName: "Trust Incident Finalize Workspace",
            createdAt: new Date().toISOString(),
          },
          {
            id: "pat",
            email: "pat@example.com",
            name: "Pat Approver",
            role: "approver",
            status: "active",
            workspaceId,
            workspaceName: "Trust Incident Finalize Workspace",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.environmentPolicies = {
      ...(collab.governance.environmentPolicies || {}),
      production: {
        ...(collab.governance.environmentPolicies?.production || {}),
        promoteTrustDropToIncident: true,
        trustDropAction: "notify",
        requireApprovalForResolved: true,
        requireSummaryShareBeforeArchived: true,
        requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
      },
    };
    collab.governance.appliedApprovalPolicies = [
      {
        id: "policy_regressed_finalize",
        recommendationId: "approval-policy-pressure:user:pat",
        recommendationKind: "capacity",
        environment: "production",
        title: "Reduce load on user:pat",
        appliedAt: new Date().toISOString(),
        appliedByName: "Jamie Lead",
        effectSummary: "Reduced load on pat.",
        impact: { status: "regressed", summary: "Approval latency regressed." },
      },
    ];
    collab.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 88,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(collab);

    await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: "Investigate trust recovery readiness." } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const recoveredState = loadCollaborationState();
    recoveredState.governance.appliedApprovalPolicies = recoveredState.governance.appliedApprovalPolicies.map((item) => ({
      ...item,
      impact: { status: "improved", summary: "Approval latency recovered." },
    }));
    recoveredState.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 50,
        regressedCount: 2,
        improvedCount: 0,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 2,
      },
      {
        environment: "production",
        takenAt: new Date().toISOString(),
        score: 82,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(recoveredState);

    const recovered = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const approvalId = recovered.overview.collaboration.approvals.find(
      (item) =>
        item.status === "pending" &&
        item.action === "collaboration:automation-set-status" &&
        item.payload?.workspaceId === workspaceId &&
        item.payload?.incidentStatus === "resolved"
    )?.id;

    assert.ok(approvalId);

    const approved = await handleConsoleRequest(
      {
        action: "approval:approve",
        payload: { approvalId },
      },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );

    const workspaceHealth = approved.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(workspaceHealth?.incidentStatus, "resolved");
    assert.match(workspaceHealth?.incidentSummary || "", /Trust recovery closeout approved/i);
    assert.match(workspaceHealth?.incidentSummary || "", /Share the closeout handoff before archiving/i);
    assert.match(workspaceHealth?.incidentHandoffDraft || "", /Trust recovery handoff/i);
    assert.match(workspaceHealth?.incidentArchiveRecommendation || "", /Share the prepared trust recovery handoff/i);
    assert.equal(
      workspaceHealth?.events?.some((event) => event.type === "trust-incident-closeout-approved"),
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

test("prepared trust recovery handoff can be shared through the standard summary flow", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_trust_handoff_share_test";

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
            workspaceId,
            workspaceName: "Trust Handoff Share Workspace",
            createdAt: new Date().toISOString(),
          },
          {
            id: "pat",
            email: "pat@example.com",
            name: "Pat Approver",
            role: "approver",
            status: "active",
            workspaceId,
            workspaceName: "Trust Handoff Share Workspace",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.environmentPolicies = {
      ...(collab.governance.environmentPolicies || {}),
      production: {
        ...(collab.governance.environmentPolicies?.production || {}),
        promoteTrustDropToIncident: true,
        trustDropAction: "notify",
        requireApprovalForResolved: true,
        requireSummaryShareBeforeArchived: true,
        requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
      },
    };
    collab.governance.appliedApprovalPolicies = [
      {
        id: "policy_regressed_handoff_share",
        recommendationId: "approval-policy-pressure:user:pat",
        recommendationKind: "capacity",
        environment: "production",
        title: "Reduce load on user:pat",
        appliedAt: new Date().toISOString(),
        appliedByName: "Jamie Lead",
        effectSummary: "Reduced load on pat.",
        impact: { status: "regressed", summary: "Approval latency regressed." },
      },
    ];
    collab.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 88,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(collab);

    await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: "Investigate trust recovery readiness." } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const recoveredState = loadCollaborationState();
    recoveredState.governance.appliedApprovalPolicies = recoveredState.governance.appliedApprovalPolicies.map((item) => ({
      ...item,
      impact: { status: "improved", summary: "Approval latency recovered." },
    }));
    recoveredState.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 50,
        regressedCount: 2,
        improvedCount: 0,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 2,
      },
      {
        environment: "production",
        takenAt: new Date().toISOString(),
        score: 82,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(recoveredState);

    const recovered = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const approvalId = recovered.overview.collaboration.approvals.find(
      (item) =>
        item.status === "pending" &&
        item.action === "collaboration:automation-set-status" &&
        item.payload?.workspaceId === workspaceId &&
        item.payload?.incidentStatus === "resolved"
    )?.id;
    assert.ok(approvalId);

    await handleConsoleRequest(
      {
        action: "approval:approve",
        payload: { approvalId },
      },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );

    const shared = await handleConsoleRequest(
      {
        action: "collaboration:automation-share-summary",
        payload: { workspaceId, assignedTo: "team", useHandoffDraft: true },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const workspaceHealth = shared.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    const handoff = shared.overview.collaboration.handoffs[0];
    assert.equal(workspaceHealth?.incidentStatus, "shared");
    assert.match(handoff?.title || "", /Trust recovery handoff/i);
    assert.match(handoff?.note || "", /Trust recovery handoff/i);
    assert.equal(workspaceHealth?.incidentChecklist?.find((item) => item.id === "shared_handoff")?.completed, true);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("trust recovery archive approvals include archive rationale after handoff share", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_trust_archive_rationale_test";

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
            workspaceId,
            workspaceName: "Trust Archive Rationale Workspace",
            createdAt: new Date().toISOString(),
          },
          {
            id: "pat",
            email: "pat@example.com",
            name: "Pat Approver",
            role: "approver",
            status: "active",
            workspaceId,
            workspaceName: "Trust Archive Rationale Workspace",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.governance.environmentPolicies = {
      ...(collab.governance.environmentPolicies || {}),
      production: {
        ...(collab.governance.environmentPolicies?.production || {}),
        promoteTrustDropToIncident: true,
        trustDropAction: "notify",
        requireApprovalForResolved: true,
        requireApprovalForArchived: true,
        requireSummaryShareBeforeArchived: true,
        requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
      },
    };
    collab.governance.appliedApprovalPolicies = [
      {
        id: "policy_regressed_archive_rationale",
        recommendationId: "approval-policy-pressure:user:pat",
        recommendationKind: "capacity",
        environment: "production",
        title: "Reduce load on user:pat",
        appliedAt: new Date().toISOString(),
        appliedByName: "Jamie Lead",
        effectSummary: "Reduced load on pat.",
        impact: { status: "regressed", summary: "Approval latency regressed." },
      },
    ];
    collab.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 88,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(collab);

    await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: "Investigate trust recovery readiness." } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const recoveredState = loadCollaborationState();
    recoveredState.governance.appliedApprovalPolicies = recoveredState.governance.appliedApprovalPolicies.map((item) => ({
      ...item,
      impact: { status: "improved", summary: "Approval latency recovered." },
    }));
    recoveredState.governance.approvalTrustHistory = [
      {
        environment: "production",
        takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        score: 50,
        regressedCount: 2,
        improvedCount: 0,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 2,
      },
      {
        environment: "production",
        takenAt: new Date().toISOString(),
        score: 82,
        regressedCount: 0,
        improvedCount: 2,
        rolledBackCount: 0,
        observingCount: 0,
        cooldownCount: 0,
        alertCount: 0,
      },
    ];
    saveCollaborationState(recoveredState);

    const recovered = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const resolveApprovalId = recovered.overview.collaboration.approvals.find(
      (item) =>
        item.status === "pending" &&
        item.action === "collaboration:automation-set-status" &&
        item.payload?.workspaceId === workspaceId &&
        item.payload?.incidentStatus === "resolved"
    )?.id;
    assert.ok(resolveApprovalId);

    await handleConsoleRequest(
      {
        action: "approval:approve",
        payload: { approvalId: resolveApprovalId },
      },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );

    await handleConsoleRequest(
      {
        action: "collaboration:automation-share-summary",
        payload: { workspaceId, assignedTo: "team", useHandoffDraft: true },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const archiveRequested = await handleConsoleRequest(
      {
        action: "collaboration:automation-set-status",
        payload: { workspaceId, incidentStatus: "archived" },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const archiveApproval = archiveRequested.overview.collaboration.approvals.find(
      (item) =>
        item.status === "pending" &&
        item.action === "collaboration:automation-set-status" &&
        item.payload?.workspaceId === workspaceId &&
        item.payload?.incidentStatus === "archived"
    );
    const workspaceHealth = archiveRequested.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);

    assert.ok(archiveApproval);
    assert.match(archiveApproval?.payload?.archiveRationale || "", /Trust recovery closeout was approved/i);
    assert.match(workspaceHealth?.incidentApproval?.archiveRationale || "", /Trust recovery closeout was approved/i);

    const archived = await handleConsoleRequest(
      {
        action: "approval:approve",
        payload: { approvalId: archiveApproval.id },
      },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );

    const archivedWorkspace = archived.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(archivedWorkspace?.incidentStatus, "archived");
    assert.match(archivedWorkspace?.incidentSummary || "", /Trust incident archived/i);
    assert.equal(archivedWorkspace?.incidentHandoffDraft, null);
    assert.equal(archivedWorkspace?.incidentArchiveRecommendation, null);
    assert.equal(
      archivedWorkspace?.events?.some((event) => event.type === "trust-incident-archived"),
      true
    );

    const trustReport = await handleConsoleRequest(
      { command: "trust:report" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    assert.match(String(trustReport.output || ""), /Completed trust incidents/);
    assert.match(String(trustReport.output || ""), /Trust Archive Rationale Workspace/);
    assert.match(String(trustReport.output || ""), /archived/i);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("auto digest queue helper enqueues due workspace sweep only when eligible", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_auto_digest_queue_test";

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
            workspaceName: "Auto Queue Workspace",
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
          cadence: "handoff",
          preferredChannel: "history",
        },
      },
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );

    const none = queueDueDigestSweepIfNeeded(workspaceId, { actorId: "system", actorName: "System" });
    assert.equal(none, null);

    await handleConsoleRequest(
      {
        action: "collaboration:create-handoff",
        payload: {
          title: "Auto queue handoff",
          note: "This should make the workspace eligible for auto digest queuing.",
          assignedTo: "user:alex",
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const queued = queueDueDigestSweepIfNeeded(workspaceId, { actorId: "system", actorName: "System" });
    assert.ok(queued);
    assert.equal(queued.type, "digest:run-due");

    const duplicate = queueDueDigestSweepIfNeeded(workspaceId, { actorId: "system", actorName: "System" });
    assert.equal(duplicate, null);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("digest scheduler sweep scans workspaces and queues due digest jobs", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_scheduler_digest_test";

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
            workspaceName: "Scheduler Digest Workspace",
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
          cadence: "handoff",
          preferredChannel: "history",
        },
      },
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );

    await handleConsoleRequest(
      {
        action: "collaboration:create-handoff",
        payload: {
          title: "Scheduler handoff",
          note: "This should trigger the digest scheduler sweep.",
          assignedTo: "user:alex",
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const result = await runDigestSchedulerSweep();
    assert.equal(result.ok, true);
    assert.ok(result.workspaceCount >= 1);
    assert.ok(result.queuedJobCount >= 1);
  } finally {
    stopDigestScheduler();
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("overview exposes digest scheduler health after a sweep", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_digest_health_test";

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
            workspaceName: "Digest Health Workspace",
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
          cadence: "handoff",
          preferredChannel: "history",
        },
      },
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );

    await handleConsoleRequest(
      {
        action: "collaboration:create-handoff",
        payload: {
          title: "Digest health handoff",
          note: "This should make the scheduler report queued work.",
          assignedTo: "user:alex",
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    await runDigestSchedulerSweep();

    const overview = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.ok(overview.overview.collaboration.digestScheduler.lastRunAt);
    assert.ok((overview.overview.collaboration.digestScheduler.lastResult?.workspaceCount || 0) >= 1);
    assert.ok((overview.overview.collaboration.digestScheduler.lastResult?.queuedJobCount || 0) >= 1);
    assert.equal(
      overview.overview.collaboration.digestWorkspaceHealth.some((item) => item.workspaceId === workspaceId),
      true
    );
  } finally {
    stopDigestScheduler();
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("digest automation health surfaces derived workspace alerts before a sweep runs", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_digest_alert_test";

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
            workspaceName: "Digest Alert Workspace",
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
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );

    const activeAlerts = await handleConsoleRequest(
      { command: "alerts:active" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const digestHealth = await handleConsoleRequest(
      { command: "digest:health" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const overview = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.match(activeAlerts.output, /overdue for a digest sweep/i);
    assert.match(digestHealth.output, /workspace_digest_alert_test/i);
    assert.match(digestHealth.output, /stalled/i);
    assert.equal(
      overview.overview.collaboration.inbox.some((item) => item.type === "automation" && /digest/i.test(item.title)),
      true
    );
    assert.equal(
      overview.overview.collaboration.digestEscalations.some((item) => item.id === `digest-escalation:${workspaceId}`),
      true
    );
  } finally {
    stopDigestScheduler();
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("admins can assign, snooze, and rerun workspace automation escalations", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_ops_actions_test";

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
            workspaceName: "Workspace Ops Test",
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
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );

    const before = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const automationItem = before.overview.collaboration.inbox.find((item) => item.type === "automation" && item.workspaceId === workspaceId);
    assert.ok(automationItem);

    const assigned = await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    assert.equal(assigned.ok, true);
    assert.equal(assigned.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId)?.escalationOwner, "Jamie Lead");

    const snoozed = await handleConsoleRequest(
      { action: "collaboration:automation-snooze", payload: { workspaceId, minutes: 60 } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    assert.equal(snoozed.ok, true);
    assert.ok(snoozed.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId)?.snoozedUntil);

    const rerun = await handleConsoleRequest(
      { action: "collaboration:automation-run-sweep", payload: { workspaceId } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    assert.equal(rerun.ok, true);
    assert.ok(rerun.output.includes(workspaceId));
  } finally {
    stopDigestScheduler();
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("admins can create owned follow-up tasks from workspace automation escalations", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_ops_followup_test";

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
            workspaceName: "Workspace Followup Test",
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
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );

    const created = await handleConsoleRequest(
      {
        action: "collaboration:automation-create-followup",
        payload: {
          workspaceId,
          owner: "Jamie Lead",
          agentName: "planner",
          description: "Investigate why workspace digests are stalling.",
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.equal(created.ok, true);
    const task = loadQueue().tasks.find((item) => String(item.workspaceId || item.linkedWorkspaceId || "") === workspaceId);
    assert.ok(task);
    assert.equal(task.ownerName, "Jamie Lead");
    assert.ok(Array.isArray(task.tags) && task.tags.includes("automation-escalation"));
    assert.equal(
      created.overview.collaboration.automationFollowups.some((item) => item.workspaceId === workspaceId && item.ownerName === "Jamie Lead"),
      true
    );
  } finally {
    stopDigestScheduler();
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("completed automation follow-up tasks resolve workspace escalation health", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_ops_resolution_test";

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
            workspaceName: "Workspace Resolution Test",
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
      { userId: "alex", userName: "Alex Editor", userRole: "operator", workspaceId }
    );

    await handleConsoleRequest(
      {
        action: "collaboration:automation-create-followup",
        payload: {
          workspaceId,
          owner: "Jamie Lead",
          agentName: "planner",
          description: "Close the loop on digest automation.",
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const task = loadQueue().tasks.find((item) => String(item.workspaceId || item.linkedWorkspaceId || "") === workspaceId);
    assert.ok(task);
    completeTask(task.id, { summary: "Automation issue investigated and resolved." });

    const overview = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const workspaceHealth = overview.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(workspaceHealth?.status, "resolved");
    assert.equal(Boolean(workspaceHealth?.resolutionTaskId), true);
    assert.equal(
      overview.overview.collaboration.digestEscalations.some((item) => item.workspaceId === workspaceId),
      false
    );
    assert.equal(
      overview.overview.collaboration.automationFollowups.some((item) => item.workspaceId === workspaceId && item.status === "completed"),
      true
    );
  } finally {
    stopDigestScheduler();
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("workspace automation notes persist in the workspace timeline", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_ops_notes_test";

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
            workspaceName: "Workspace Notes Test",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    const noted = await handleConsoleRequest(
      {
        action: "collaboration:automation-add-note",
        payload: {
          workspaceId,
          note: "Root cause: digest users had accumulated untriaged handoffs.",
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.equal(noted.ok, true);
    const workspaceHealth = noted.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(Array.isArray(workspaceHealth?.events), true);
    assert.equal(
      workspaceHealth?.events?.some((event) => event.type === "workspace-note" && String(event.note || "").includes("Root cause")),
      true
    );
  } finally {
    stopDigestScheduler();
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("workspace incident summaries can be generated from automation history", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_ops_summary_test";

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
            workspaceName: "Workspace Summary Test",
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
        action: "collaboration:automation-add-note",
        payload: {
          workspaceId,
          note: "Root cause was delayed triage on accumulated handoffs.",
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const summarized = await handleConsoleRequest(
      {
        action: "collaboration:automation-generate-summary",
        payload: {
          workspaceId,
        },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.equal(summarized.ok, true);
    const workspaceHealth = summarized.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(typeof workspaceHealth?.incidentSummary, "string");
    assert.match(workspaceHealth?.incidentSummary || "", /Workspace Summary Test/);
    assert.equal(
      workspaceHealth?.events?.some((event) => event.type === "incident-summary"),
      true
    );
  } finally {
    stopDigestScheduler();
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("workspace incident summaries can be shared as handoffs and update incident status", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_ops_share_test";

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
            workspaceName: "Workspace Share Test",
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
        action: "collaboration:automation-generate-summary",
        payload: { workspaceId },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const shared = await handleConsoleRequest(
      {
        action: "collaboration:automation-share-summary",
        payload: { workspaceId, assignedTo: "user:alex" },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.equal(shared.ok, true);
    const workspaceHealth = shared.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(workspaceHealth?.incidentStatus, "shared");
    assert.equal(shared.overview.collaboration.handoffs.some((item) => item.assignedTo === "user:alex" && item.title.includes("Incident summary")), true);
  } finally {
    stopDigestScheduler();
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("workspace incident checklist updates automatically and supports manual toggles", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_ops_checklist_test";

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
            workspaceName: "Workspace Checklist Test",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    const assigned = await handleConsoleRequest(
      {
        action: "collaboration:automation-assign",
        payload: { workspaceId, owner: "Jamie Lead" },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const afterAuto = assigned.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(afterAuto?.incidentChecklist.find((item) => item.id === "owner_assigned")?.completed, true);

    const toggled = await handleConsoleRequest(
      {
        action: "collaboration:automation-checklist-toggle",
        payload: { workspaceId, itemId: "shared_handoff", completed: true },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    const afterToggle = toggled.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(afterToggle?.incidentChecklist.find((item) => item.id === "shared_handoff")?.completed, true);
  } finally {
    stopDigestScheduler();
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("operators cannot approve requests or change governance, but approvers can approve", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    const requestedResolution = await handleConsoleRequest(
      {
        action: "agent:update-config",
        payload: {
          agentName: "researcher",
          role: "Needs approval",
        },
      },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );

    assert.equal(requestedResolution.ok, true);
    const approvalId = requestedResolution.overview.collaboration.approvals[0].id;

    const governanceDenied = await handleConsoleRequest(
      {
        action: "collaboration:update-governance",
        payload: { sensitiveActionsRequireApproval: false },
      },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );

    assert.equal(governanceDenied.ok, false);
    assert.match(governanceDenied.error, /not allowed/);

    const approvalDenied = await handleConsoleRequest(
      {
        action: "approval:approve",
        payload: { approvalId },
      },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );

    assert.equal(approvalDenied.ok, false);
    assert.match(approvalDenied.error, /not allowed/);

    const approved = await handleConsoleRequest(
      {
        action: "approval:approve",
        payload: { approvalId },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "approver" }
    );

    assert.equal(approved.ok, true);
    assert.equal(approved.overview.collaboration.currentUser.role, "approver");
    assert.equal(approved.overview.collaboration.permissions.canApprove, true);
  } finally {
    restoreFiles(snapshot);
  }
});

test("environment governance can tighten command execution requirements", async () => {
  const snapshot = snapshotFiles(FILES);

  try {
    resetState();
    await handleConsoleRequest(
      {
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
          environmentPolicies: {
            production: {
              minimumRoleForCommands: "approver",
              minimumRoleForApprovals: "approver",
              minimumRoleForGovernance: "admin",
            },
          },
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", bypassApproval: true }
    );

    const denied = await handleConsoleRequest(
      { command: "help" },
      { userId: "alex", userName: "Alex Editor", userRole: "operator" }
    );
    assert.equal(denied.ok, false);
    assert.match(denied.error, /cannot execute console commands/i);

    const allowed = await handleConsoleRequest(
      { command: "help" },
      { userId: "jamie", userName: "Jamie Lead", userRole: "approver" }
    );
    assert.equal(allowed.ok, true);
  } finally {
    restoreFiles(snapshot);
  }
});

test("production incident closeout blocks unresolved checklist items before requesting approval", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_ops_production_policy_test";

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
            workspaceName: "Workspace Production Policy Test",
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
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", bypassApproval: true }
    );

    const blocked = await handleConsoleRequest(
      {
        action: "collaboration:automation-set-status",
        payload: { workspaceId, incidentStatus: "resolved" },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.equal(blocked.ok, false);
    assert.match(blocked.error || "", /Complete "/);
    assert.equal(blocked.overview.collaboration.approvals.length, 0);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("production incident resolution requires approval after closeout requirements are satisfied", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_ops_production_approval_test";

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
            workspaceName: "Workspace Production Approval Test",
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
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", bypassApproval: true }
    );

    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: "Investigate digest latency." } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-generate-summary", payload: { workspaceId } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-share-summary", payload: { workspaceId, assignedTo: "user:alex" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const requestedResolution = await handleConsoleRequest(
      {
        action: "collaboration:automation-set-status",
        payload: { workspaceId, incidentStatus: "resolved" },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.equal(requestedResolution.ok, true);
    assert.match(requestedResolution.output, /Approval requested/);
    const approvalId = requestedResolution.overview.collaboration.approvals[0].id;

    const approved = await handleConsoleRequest(
      {
        action: "approval:approve",
        payload: { approvalId },
      },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );

    assert.equal(approved.ok, true);
    const workspaceHealth = approved.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(workspaceHealth?.incidentStatus, "resolved");
    assert.equal(workspaceHealth?.incidentPolicy.environment, "production");
    assert.equal(workspaceHealth?.incidentPolicy.requireApprovalForResolved, true);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("production incident archive requires approval after the summary handoff is completed", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_ops_production_archive_test";

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
            workspaceName: "Workspace Production Archive Test",
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
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", bypassApproval: true }
    );

    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: "Investigate digest archive readiness." } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-generate-summary", payload: { workspaceId } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-share-summary", payload: { workspaceId, assignedTo: "user:alex" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const requestedArchive = await handleConsoleRequest(
      {
        action: "collaboration:automation-set-status",
        payload: { workspaceId, incidentStatus: "archived" },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    assert.equal(requestedArchive.ok, true);
    assert.match(requestedArchive.output, /Approval requested/);
    const approvalId = requestedArchive.overview.collaboration.approvals[0].id;

    const approved = await handleConsoleRequest(
      {
        action: "approval:approve",
        payload: { approvalId },
      },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );

    assert.equal(approved.ok, true);
    const workspaceHealth = approved.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(workspaceHealth?.incidentStatus, "archived");
    assert.equal(workspaceHealth?.incidentPolicy.requireApprovalForArchived, true);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("workspace health exposes pending and approved incident closeout attribution", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_ops_approval_visibility_test";

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
            workspaceName: "Workspace Approval Visibility Test",
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
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", bypassApproval: true }
    );

    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: "Investigate closeout attribution." } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-generate-summary", payload: { workspaceId } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-share-summary", payload: { workspaceId, assignedTo: "user:alex" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const requestedVisibility = await handleConsoleRequest(
      {
        action: "collaboration:automation-set-status",
        payload: { workspaceId, incidentStatus: "resolved" },
      },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const pendingWorkspace = requestedVisibility.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(pendingWorkspace?.incidentApproval?.state, "pending");
    assert.equal(pendingWorkspace?.incidentApproval?.requestedByName, "Jamie Lead");
    assert.match(pendingWorkspace?.incidentApproval?.label || "", /Approve incident resolved/i);

    const approvalId = requestedVisibility.overview.collaboration.approvals[0].id;
    const approved = await handleConsoleRequest(
      {
        action: "approval:approve",
        payload: { approvalId },
      },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );

    const approvedWorkspace = approved.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(approvedWorkspace?.incidentApproval?.state, "approved");
    assert.equal(approvedWorkspace?.incidentApproval?.approvedByName, "Pat Approver");
    assert.equal(
      approvedWorkspace?.events?.some((event) => event.type === "incident-approval" && /Approved incident transition/.test(event.message)),
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

test("incident approvals can target a specific approver and block other approvers", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_ops_targeted_approval_test";

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
            workspaceName: "Workspace Targeted Approval Test",
            createdAt: new Date().toISOString(),
          },
          {
            id: "pat",
            email: "pat@example.com",
            name: "Pat Approver",
            role: "approver",
            status: "active",
            workspaceId,
            workspaceName: "Workspace Targeted Approval Test",
            createdAt: new Date().toISOString(),
          },
          {
            id: "sam",
            email: "sam@example.com",
            name: "Sam Approver",
            role: "approver",
            status: "active",
            workspaceId,
            workspaceName: "Workspace Targeted Approval Test",
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
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", bypassApproval: true }
    );

    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-assign-approver", payload: { workspaceId, approverTarget: "user:pat" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: "Investigate targeted approval flow." } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-generate-summary", payload: { workspaceId } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-share-summary", payload: { workspaceId, assignedTo: "user:alex" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const requestedTargeted = await handleConsoleRequest(
      { action: "collaboration:automation-set-status", payload: { workspaceId, incidentStatus: "resolved" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const approvalId = requestedTargeted.overview.collaboration.approvals[0].id;
    const workspaceHealth = requestedTargeted.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(workspaceHealth?.incidentApproverTarget, "user:pat");
    assert.equal(workspaceHealth?.incidentApproval?.approverTarget, "user:pat");

    const patInbox = await handleConsoleRequest(
      { command: "inbox:list" },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );
    assert.match(patInbox.output, /Approve incident resolved/i);

    const samInbox = await handleConsoleRequest(
      { command: "inbox:list" },
      { userId: "sam", userName: "Sam Approver", userRole: "approver", workspaceId }
    );
    assert.doesNotMatch(samInbox.output, /Approve incident resolved/i);

    const denied = await handleConsoleRequest(
      { action: "approval:approve", payload: { approvalId } },
      { userId: "sam", userName: "Sam Approver", userRole: "approver", workspaceId }
    );
    assert.equal(denied.ok, false);
    assert.match(denied.error || "", /assigned to user:pat/i);

    const approved = await handleConsoleRequest(
      { action: "approval:approve", payload: { approvalId } },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );
    assert.equal(approved.ok, true);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

test("overdue targeted incident approvals create one delegated reminder handoff", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceId = "workspace_ops_approval_reminder_test";

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
            workspaceName: "Workspace Approval Reminder Test",
            createdAt: new Date().toISOString(),
          },
          {
            id: "pat",
            email: "pat@example.com",
            name: "Pat Approver",
            role: "approver",
            status: "active",
            workspaceId,
            workspaceName: "Workspace Approval Reminder Test",
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
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", bypassApproval: true }
    );

    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-assign-approver", payload: { workspaceId, approverTarget: "user:pat" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: "Investigate reminder flow." } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-generate-summary", payload: { workspaceId } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-share-summary", payload: { workspaceId, assignedTo: "user:alex" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    await handleConsoleRequest(
      { action: "collaboration:automation-set-status", payload: { workspaceId, incidentStatus: "resolved" } },
      { userId: "jamie", userName: "Jamie Lead", userRole: "admin", workspaceId }
    );

    const state = loadCollaborationState();
    state.approvals[0].createdAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    saveCollaborationState(state);

    const patView = await handleConsoleRequest(
      { command: "help" },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );
    assert.equal(
      patView.overview.collaboration.handoffs.filter((item) => item.kind === "incident-approval-reminder" && item.assignedTo === "user:pat").length,
      1
    );
    assert.equal(
      patView.overview.collaboration.inbox.some((item) => item.type === "handoff" && /Approval reminder/i.test(item.title)),
      true
    );

    const secondView = await handleConsoleRequest(
      { command: "help" },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );
    assert.equal(
      secondView.overview.collaboration.handoffs.filter((item) => item.kind === "incident-approval-reminder" && item.assignedTo === "user:pat").length,
      1
    );

    const workspaceHealth = secondView.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(
      workspaceHealth?.events?.some((event) => event.type === "incident-approval-reminder"),
      true
    );
    assert.equal(workspaceHealth?.incidentApprovalSla?.overdue, true);
    assert.equal((workspaceHealth?.incidentApprovalSla?.ageMs || 0) > 0, true);

    const approvalId = secondView.overview.collaboration.approvals.find((item) => item.status === "pending")?.id;
    assert.ok(approvalId);
    const approved = await handleConsoleRequest(
      { action: "approval:approve", payload: { approvalId } },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );
    assert.equal(approved.ok, true);
    assert.equal(
      approved.overview.collaboration.handoffs.some((item) => item.kind === "incident-approval-reminder" && item.status === "open"),
      false
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

test("incident approval reminders and escalations honor custom environment policy thresholds", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;
  const workspaceId = "workspace-escalation-policy";

  try {
    resetState();
    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          { id: "admin", name: "Admin User", email: "admin@example.com", role: "admin", workspaceId, workspaceName: "Policy Workspace", status: "active" },
          { id: "pat", name: "Pat Approver", email: "pat@example.com", role: "approver", workspaceId, workspaceName: "Policy Workspace", status: "active" },
          { id: "alex", name: "Alex Admin", email: "alex@example.com", role: "admin", workspaceId, workspaceName: "Policy Workspace", status: "active" },
        ],
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      {
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
          environmentPolicies: {
            production: {
              minimumRoleForCommands: "operator",
              minimumRoleForApprovals: "approver",
              minimumRoleForGovernance: "admin",
              requireChecklistForResolved: true,
              requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
              requireSummaryShareBeforeArchived: true,
              requireApprovalForResolved: true,
              requireApprovalForArchived: true,
              incidentApprovalReminderMinutes: 2,
              incidentApprovalEscalationMinutes: 4,
              incidentApprovalEscalationTarget: "user:alex",
              incidentApprovalFinalEscalationMinutes: 6,
              incidentApprovalFinalEscalationTarget: "team",
            },
          },
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", bypassApproval: true }
    );

    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-assign-approver", payload: { workspaceId, approverTarget: "user:pat" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: "Investigate escalation thresholds." } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-generate-summary", payload: { workspaceId } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-share-summary", payload: { workspaceId, assignedTo: "team" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-set-status", payload: { workspaceId, incidentStatus: "resolved" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );

    const state = loadCollaborationState();
    state.approvals[0].createdAt = new Date(Date.now() - 7 * 60 * 1000).toISOString();
    saveCollaborationState(state);

    const approverView = await handleConsoleRequest(
      { command: "help" },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );
    const workspaceHealth = approverView.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(workspaceHealth?.incidentApprovalSla?.reminderDelayMs, 2 * 60 * 1000);
    assert.equal(workspaceHealth?.incidentApprovalSla?.escalationDelayMs, 4 * 60 * 1000);
    assert.equal(workspaceHealth?.incidentApprovalSla?.finalEscalationDelayMs, 6 * 60 * 1000);
    assert.equal(workspaceHealth?.incidentApprovalSla?.overdue, true);
    assert.equal(workspaceHealth?.incidentApprovalSla?.escalated, true);
    assert.equal(workspaceHealth?.incidentApprovalSla?.finalEscalated, true);
    assert.equal(workspaceHealth?.incidentPolicy.incidentApprovalEscalationTarget, "user:alex");
    assert.equal(
      approverView.overview.collaboration.handoffs.some(
        (item) => item.kind === "incident-approval-reminder" && item.relatedApprovalId === state.approvals[0].id && item.assignedTo === "user:pat"
      ),
      true
    );
    assert.equal(
      approverView.overview.collaboration.handoffs.some(
        (item) => item.kind === "incident-approval-escalation" && item.relatedApprovalId === state.approvals[0].id && item.assignedTo === "user:alex"
      ),
      true
    );
    assert.equal(
      approverView.overview.collaboration.handoffs.some(
        (item) => item.kind === "incident-approval-final-escalation" && item.relatedApprovalId === state.approvals[0].id && item.assignedTo === "team"
      ),
      true
    );
    assert.equal(
      workspaceHealth?.events?.some((event) => event.type === "incident-approval-escalation"),
      true
    );
    assert.equal(
      workspaceHealth?.events?.some((event) => event.type === "incident-approval-final-escalation"),
      true
    );
    const pressure = approverView.overview.collaboration.incidentApprovalPressure.find((item) => item.target === "user:pat");
    assert.equal(pressure?.pendingCount, 1);
    assert.equal(pressure?.overdueCount, 1);
    assert.equal(pressure?.escalatedCount, 1);
    assert.equal(pressure?.finalEscalatedCount, 1);
    assert.equal(pressure?.workspaces[0]?.workspaceId, workspaceId);
    assert.equal(
      approverView.overview.collaboration.digestEscalations.some((item) => item.id === "approval-pressure:user:pat" && /final-escalated/i.test(item.title)),
      true
    );
    assert.equal(
      approverView.overview.collaboration.approvalPolicyRecommendations.some((item) => item.target === "user:pat"),
      true
    );

    const approvalId = state.approvals[0].id;
    const reassigned = await handleConsoleRequest(
      { action: "approval:reassign-target", payload: { approvalId, approverTarget: "user:alex" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    assert.equal(reassigned.ok, true);
    const reassignedWorkspace = reassigned.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(reassignedWorkspace?.incidentApproval?.approverTarget, "user:alex");
    assert.equal(
      reassigned.overview.collaboration.handoffs.some(
        (item) => item.kind === "incident-approval-reminder" && item.relatedApprovalId === approvalId && item.assignedTo === "user:alex" && item.status === "open"
      ),
      true
    );
    assert.equal(
      reassignedWorkspace?.events?.some((event) => event.type === "incident-approval-rerouted"),
      true
    );

    const takenOver = await handleConsoleRequest(
      { action: "approval:take-over", payload: { approvalId } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    assert.equal(takenOver.ok, true);
    const ownedWorkspace = takenOver.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(ownedWorkspace?.incidentApproval?.approverTarget, "user:admin");
    assert.equal(
      takenOver.overview.collaboration.handoffs.some(
        (item) => item.kind === "incident-approval-reminder" && item.relatedApprovalId === approvalId && item.assignedTo === "user:admin" && item.status === "open"
      ),
      true
    );
    const throughput = takenOver.overview.collaboration.approvalThroughput;
    assert.equal(throughput.totals.totalApprovals >= 1, true);
    assert.equal(throughput.totals.manualReroutes >= 1, true);
    assert.equal(
      throughput.targets.some((entry) => entry.rerouted >= 1),
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

test("final-escalated incident approvals auto-reroute to the configured backup approver", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;
  const workspaceId = "workspace-backup-approver";

  try {
    resetState();
    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          { id: "admin", name: "Admin User", email: "admin@example.com", role: "admin", workspaceId, workspaceName: "Backup Workspace", status: "active" },
          { id: "pat", name: "Pat Approver", email: "pat@example.com", role: "approver", workspaceId, workspaceName: "Backup Workspace", status: "active" },
          { id: "alex", name: "Alex Backup", email: "alex@example.com", role: "approver", workspaceId, workspaceName: "Backup Workspace", status: "active" },
        ],
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      {
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
          environmentPolicies: {
            production: {
              minimumRoleForCommands: "operator",
              minimumRoleForApprovals: "approver",
              minimumRoleForGovernance: "admin",
              requireChecklistForResolved: true,
              requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
              requireSummaryShareBeforeArchived: true,
              requireApprovalForResolved: true,
              requireApprovalForArchived: true,
              incidentApprovalReminderMinutes: 1,
              incidentApprovalEscalationMinutes: 2,
              incidentApprovalEscalationTarget: "role:admin",
              incidentApprovalFinalEscalationMinutes: 3,
              incidentApprovalFinalEscalationTarget: "team",
            },
          },
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", bypassApproval: true }
    );

    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-assign-approver", payload: { workspaceId, approverTarget: "user:pat" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-assign-backup-approver", payload: { workspaceId, backupApproverTarget: "user:alex" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: "Investigate backup reroute." } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-generate-summary", payload: { workspaceId } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-share-summary", payload: { workspaceId, assignedTo: "team" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-set-status", payload: { workspaceId, incidentStatus: "resolved" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );

    const state = loadCollaborationState();
    state.approvals[0].createdAt = new Date(Date.now() - 4 * 60 * 1000).toISOString();
    saveCollaborationState(state);

    const rerouted = await handleConsoleRequest(
      { command: "help" },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );

    const workspaceHealth = rerouted.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(workspaceHealth?.backupApproverTarget, "user:alex");
    assert.equal(workspaceHealth?.incidentApproval?.approverTarget, "user:alex");
    assert.equal(
      rerouted.overview.collaboration.handoffs.some(
        (item) => item.kind === "incident-approval-reminder" && item.assignedTo === "user:alex" && item.status === "open"
      ),
      true
    );
    assert.equal(
      workspaceHealth?.events?.some((event) => event.type === "incident-approval-auto-rerouted"),
      true
    );
    assert.equal(rerouted.overview.collaboration.approvalThroughput.totals.autoReroutes >= 1, true);
    assert.equal(
      rerouted.overview.collaboration.approvalThroughput.targets.some((entry) => entry.target === "user:alex" && entry.autoRerouted >= 1),
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

test("admins can bulk reassign approval pressure targets across workspaces", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    const workspaceAlpha = "workspace_bulk_alpha";
    const workspaceBeta = "workspace_bulk_beta";

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
            workspaceName: "Bulk Alpha",
            createdAt: new Date().toISOString(),
          },
          {
            id: "beta-admin",
            email: "beta@example.com",
            name: "Beta Admin",
            role: "admin",
            status: "active",
            workspaceId: workspaceBeta,
            workspaceName: "Bulk Beta",
            createdAt: new Date().toISOString(),
          },
        ],
        null,
        2
      ),
      "utf8"
    );

    const collab = loadCollaborationState();
    collab.governance.currentEnvironment = "production";
    collab.approvals = [
      {
        id: "approval_bulk_alpha",
        action: "collaboration:automation-set-status",
        label: "Approve incident resolved for Bulk Alpha",
        status: "pending",
        payload: { workspaceId: workspaceAlpha, incidentStatus: "resolved" },
        approverTarget: "user:pat",
        createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        requestedById: "admin",
        requestedByName: "Admin User",
      },
      {
        id: "approval_bulk_beta",
        action: "collaboration:automation-set-status",
        label: "Approve incident resolved for Bulk Beta",
        status: "pending",
        payload: { workspaceId: workspaceBeta, incidentStatus: "resolved" },
        approverTarget: "user:pat",
        createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
        requestedById: "beta-admin",
        requestedByName: "Beta Admin",
      },
    ];
    saveCollaborationState(collab);

    const reassigned = await handleConsoleRequest(
      {
        action: "approval:bulk-reassign-target",
        payload: { currentTarget: "user:pat", approverTarget: "user:alex" },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: workspaceAlpha }
    );

    assert.equal(reassigned.ok, true);
    assert.match(reassigned.output, /Reassigned 2 approvals/i);
    assert.equal(
      reassigned.overview.collaboration.digestWorkspaceHealth.filter((item) => item.incidentApproval?.approverTarget === "user:alex").length >= 2,
      true
    );
    assert.equal(
      reassigned.overview.collaboration.incidentApprovalPressure.some((item) => item.target === "user:pat"),
      false
    );
    assert.equal(
      reassigned.overview.collaboration.incidentApprovalPressure.some((item) => item.target === "user:alex"),
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

test("new incident approvals use the backup approver when the primary target is at capacity", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  try {
    resetState();
    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          { id: "admin", name: "Admin User", email: "admin@example.com", role: "admin", workspaceId: "workspace-capacity-a", workspaceName: "Capacity A", status: "active" },
          { id: "pat", name: "Pat Approver", email: "pat@example.com", role: "approver", workspaceId: "workspace-capacity-a", workspaceName: "Capacity A", status: "active" },
          { id: "alex", name: "Alex Backup", email: "alex@example.com", role: "approver", workspaceId: "workspace-capacity-a", workspaceName: "Capacity A", status: "active" },
          { id: "admin", name: "Admin User", email: "admin@example.com", role: "admin", workspaceId: "workspace-capacity-b", workspaceName: "Capacity B", status: "active" },
          { id: "pat", name: "Pat Approver", email: "pat@example.com", role: "approver", workspaceId: "workspace-capacity-b", workspaceName: "Capacity B", status: "active" },
          { id: "alex", name: "Alex Backup", email: "alex@example.com", role: "approver", workspaceId: "workspace-capacity-b", workspaceName: "Capacity B", status: "active" },
        ],
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      {
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
          environmentPolicies: {
            production: {
              minimumRoleForCommands: "operator",
              minimumRoleForApprovals: "approver",
              minimumRoleForGovernance: "admin",
              requireChecklistForResolved: true,
              requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
              requireSummaryShareBeforeArchived: true,
              requireApprovalForResolved: true,
              requireApprovalForArchived: true,
              incidentApprovalReminderMinutes: 5,
              incidentApprovalEscalationMinutes: 10,
              incidentApprovalEscalationTarget: "role:admin",
              incidentApprovalFinalEscalationMinutes: 15,
              incidentApprovalFinalEscalationTarget: "team",
              incidentApprovalCapacityLimit: 1,
            },
          },
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", bypassApproval: true }
    );

    for (const workspaceId of ["workspace-capacity-a", "workspace-capacity-b"]) {
      await handleConsoleRequest(
        { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
        { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
      );
      await handleConsoleRequest(
        { action: "collaboration:automation-assign-approver", payload: { workspaceId, approverTarget: "user:pat" } },
        { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
      );
      await handleConsoleRequest(
        { action: "collaboration:automation-assign-backup-approver", payload: { workspaceId, backupApproverTarget: "user:alex" } },
        { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
      );
      await handleConsoleRequest(
        { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: `Prep ${workspaceId}` } },
        { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
      );
      await handleConsoleRequest(
        { action: "collaboration:automation-generate-summary", payload: { workspaceId } },
        { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
      );
      await handleConsoleRequest(
        { action: "collaboration:automation-share-summary", payload: { workspaceId, assignedTo: "team" } },
        { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
      );
    }

    const first = await handleConsoleRequest(
      { action: "collaboration:automation-set-status", payload: { workspaceId: "workspace-capacity-a", incidentStatus: "resolved" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: "workspace-capacity-a" }
    );
    const firstWorkspace = first.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === "workspace-capacity-a");
    assert.equal(firstWorkspace?.incidentApproval?.approverTarget, "user:pat");

    const second = await handleConsoleRequest(
      { action: "collaboration:automation-set-status", payload: { workspaceId: "workspace-capacity-b", incidentStatus: "resolved" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: "workspace-capacity-b" }
    );
    const secondWorkspace = second.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === "workspace-capacity-b");
    assert.equal(secondWorkspace?.incidentApproval?.approverTarget, "user:alex");
    assert.equal(
      secondWorkspace?.events?.some((event) => /capacity-aware routing/i.test(event.message)),
      true
    );
    const patApproved = await handleConsoleRequest(
      { action: "approval:approve", payload: { approvalId: first.overview.collaboration.approvals.find((item) => item.payload?.workspaceId === "workspace-capacity-a")?.id } },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId: "workspace-capacity-a" }
    );
    assert.equal(patApproved.ok, true);
    const alexApproved = await handleConsoleRequest(
      { action: "approval:approve", payload: { approvalId: second.overview.collaboration.approvals.find((item) => item.payload?.workspaceId === "workspace-capacity-b")?.id } },
      { userId: "alex", userName: "Alex Backup", userRole: "approver", workspaceId: "workspace-capacity-b" }
    );
    assert.equal(alexApproved.ok, true);
    const analytics = alexApproved.overview.collaboration.approvalThroughput;
    assert.equal(analytics.totals.resolvedApprovals >= 2, true);
    assert.equal(
      analytics.workspaces.some((entry) => entry.workspaceId === "workspace-capacity-b" && entry.averageApprovalMs !== null),
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

test("new incident approvals can use adaptive routing when the backup approver is performing better", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;

  async function prepareWorkspace(workspaceId, approverTarget, backupApproverTarget) {
    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-assign-approver", payload: { workspaceId, approverTarget } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-assign-backup-approver", payload: { workspaceId, backupApproverTarget } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: `Prep ${workspaceId}` } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-generate-summary", payload: { workspaceId } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-share-summary", payload: { workspaceId, assignedTo: "team" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
  }

  async function createAndApproveIncident(workspaceId, approverUserId, approverName, ageMinutes) {
    const requested = await handleConsoleRequest(
      { action: "collaboration:automation-set-status", payload: { workspaceId, incidentStatus: "resolved" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    const approvalId = requested.overview.collaboration.approvals.find((item) => item.payload?.workspaceId === workspaceId)?.id;
    assert.ok(approvalId);
    const state = loadCollaborationState();
    const approval = state.approvals.find((item) => item.id === approvalId);
    approval.createdAt = new Date(Date.now() - ageMinutes * 60 * 1000).toISOString();
    saveCollaborationState(state);
    const approved = await handleConsoleRequest(
      { action: "approval:approve", payload: { approvalId } },
      { userId: approverUserId, userName: approverName, userRole: "approver", workspaceId }
    );
    assert.equal(approved.ok, true);
  }

  try {
    resetState();
    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          { id: "admin", name: "Admin User", email: "admin@example.com", role: "admin", workspaceId: "workspace-history-pat", workspaceName: "History Pat", status: "active" },
          { id: "pat", name: "Pat Approver", email: "pat@example.com", role: "approver", workspaceId: "workspace-history-pat", workspaceName: "History Pat", status: "active" },
          { id: "alex", name: "Alex Backup", email: "alex@example.com", role: "approver", workspaceId: "workspace-history-pat", workspaceName: "History Pat", status: "active" },
          { id: "admin", name: "Admin User", email: "admin@example.com", role: "admin", workspaceId: "workspace-history-alex", workspaceName: "History Alex", status: "active" },
          { id: "pat", name: "Pat Approver", email: "pat@example.com", role: "approver", workspaceId: "workspace-history-alex", workspaceName: "History Alex", status: "active" },
          { id: "alex", name: "Alex Backup", email: "alex@example.com", role: "approver", workspaceId: "workspace-history-alex", workspaceName: "History Alex", status: "active" },
          { id: "admin", name: "Admin User", email: "admin@example.com", role: "admin", workspaceId: "workspace-adaptive", workspaceName: "Adaptive Workspace", status: "active" },
          { id: "pat", name: "Pat Approver", email: "pat@example.com", role: "approver", workspaceId: "workspace-adaptive", workspaceName: "Adaptive Workspace", status: "active" },
          { id: "alex", name: "Alex Backup", email: "alex@example.com", role: "approver", workspaceId: "workspace-adaptive", workspaceName: "Adaptive Workspace", status: "active" },
        ],
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      {
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
          environmentPolicies: {
            production: {
              minimumRoleForCommands: "operator",
              minimumRoleForApprovals: "approver",
              minimumRoleForGovernance: "admin",
              requireChecklistForResolved: true,
              requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
              requireSummaryShareBeforeArchived: true,
              requireApprovalForResolved: true,
              requireApprovalForArchived: true,
              incidentApprovalReminderMinutes: 5,
              incidentApprovalEscalationMinutes: 10,
              incidentApprovalEscalationTarget: "role:admin",
              incidentApprovalFinalEscalationMinutes: 15,
              incidentApprovalFinalEscalationTarget: "team",
              incidentApprovalCapacityLimit: 3,
            },
          },
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", bypassApproval: true }
    );

    await prepareWorkspace("workspace-history-pat", "user:pat", "user:alex");
    await createAndApproveIncident("workspace-history-pat", "pat", "Pat Approver", 50);

    await prepareWorkspace("workspace-history-alex", "user:alex", "user:pat");
    await createAndApproveIncident("workspace-history-alex", "alex", "Alex Backup", 5);

    await prepareWorkspace("workspace-adaptive", "user:pat", "user:alex");
    const adaptive = await handleConsoleRequest(
      { action: "collaboration:automation-set-status", payload: { workspaceId: "workspace-adaptive", incidentStatus: "resolved" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId: "workspace-adaptive" }
    );

    const workspaceHealth = adaptive.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === "workspace-adaptive");
    assert.equal(workspaceHealth?.incidentApproval?.approverTarget, "user:alex");
    assert.equal(workspaceHealth?.incidentApproval?.routingMode, "adaptive");
    assert.match(workspaceHealth?.incidentApproval?.routingReason || "", /faster recent approval throughput/i);
    assert.equal(
      workspaceHealth?.events?.some((event) => /adaptive routing/i.test(event.message)),
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

test("approval policy recommendations can be applied to update governance and workspace history", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;
  const workspaceId = "workspace-policy-apply";

  try {
    resetState();
    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          { id: "admin", name: "Admin User", email: "admin@example.com", role: "admin", workspaceId, workspaceName: "Policy Apply", status: "active" },
          { id: "pat", name: "Pat Approver", email: "pat@example.com", role: "approver", workspaceId, workspaceName: "Policy Apply", status: "active" },
          { id: "alex", name: "Alex Backup", email: "alex@example.com", role: "approver", workspaceId, workspaceName: "Policy Apply", status: "active" },
        ],
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      {
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
          environmentPolicies: {
            production: {
              minimumRoleForCommands: "operator",
              minimumRoleForApprovals: "approver",
              minimumRoleForGovernance: "admin",
              requireChecklistForResolved: true,
              requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
              requireSummaryShareBeforeArchived: true,
              requireApprovalForResolved: true,
              requireApprovalForArchived: true,
              incidentApprovalReminderMinutes: 5,
              incidentApprovalEscalationMinutes: 10,
              incidentApprovalEscalationTarget: "role:admin",
              incidentApprovalFinalEscalationMinutes: 15,
              incidentApprovalFinalEscalationTarget: "team",
              incidentApprovalCapacityLimit: 2,
            },
          },
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", bypassApproval: true }
    );

    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-assign-approver", payload: { workspaceId, approverTarget: "user:pat" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: "Investigate policy pressure." } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-generate-summary", payload: { workspaceId } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-share-summary", payload: { workspaceId, assignedTo: "team" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );

    const requested = await handleConsoleRequest(
      { action: "collaboration:automation-set-status", payload: { workspaceId, incidentStatus: "resolved" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    const approvalId = requested.overview.collaboration.approvals.find((item) => item.payload?.workspaceId === workspaceId)?.id;
    assert.ok(approvalId);

    const state = loadCollaborationState();
    state.approvals[0].createdAt = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    saveCollaborationState(state);

    const approved = await handleConsoleRequest(
      { action: "approval:approve", payload: { approvalId } },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );
    const recommendation = approved.overview.collaboration.approvalPolicyRecommendations.find((item) => item.target === "user:pat");
    assert.ok(recommendation?.action);
    assert.ok(recommendation?.promoteAction);
    assert.equal(typeof recommendation?.confidence?.score, "number");
    assert.ok(["low", "medium", "high"].includes(recommendation?.confidence?.label || ""));
    assert.equal(recommendation?.action?.payload?.suggestedCapacityLimit, 1);

    const applied = await handleConsoleRequest(
      {
        action: "collaboration:apply-approval-policy-recommendation",
        payload: recommendation.action.payload,
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );

    assert.equal(applied.ok, true);
    const appliedWorkspace = applied.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId);
    assert.equal(appliedWorkspace?.incidentPolicy.incidentApprovalCapacityLimit, 1);
    assert.equal(
      appliedWorkspace?.events?.some((event) => event.type === "approval-policy-recommendation-applied"),
      true
    );
    assert.equal(
      listAuditEvents(20).some((event) => event.type === "collaboration:apply-approval-policy-recommendation"),
      true
    );

    const promoted = await handleConsoleRequest(
      {
        action: "collaboration:promote-approval-policy-recommendation",
        payload: recommendation.promoteAction.payload,
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    assert.equal(promoted.ok, true);
    assert.equal(
      Array.isArray(promoted.overview.collaboration.governance?.appliedApprovalPolicies),
      true
    );
    assert.equal(
      promoted.overview.collaboration.governance.appliedApprovalPolicies.some((item) => item.recommendationId === recommendation.id),
      true
    );
    assert.equal(
      listAuditEvents(30).some((event) => event.type === "collaboration:promote-approval-policy-recommendation"),
      true
    );

    const promotionEntry = promoted.overview.collaboration.governance.appliedApprovalPolicies.find(
      (item) => item.recommendationId === recommendation.id
    );
    assert.ok(promotionEntry?.id);

    const rolledBack = await handleConsoleRequest(
      {
        action: "collaboration:rollback-approval-policy",
        payload: { promotionId: promotionEntry.id },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    assert.equal(rolledBack.ok, true);
    const rolledBackEntry = rolledBack.overview.collaboration.appliedApprovalPolicies.find(
      (item) => item.id === promotionEntry.id
    );
    assert.ok(rolledBackEntry?.rolledBackAt);
    assert.equal(rolledBackEntry?.impact?.status, "rolled_back");
    assert.equal(typeof rolledBackEntry?.impact?.comparison?.pendingDelta, "number");
    assert.equal(
      rolledBack.overview.collaboration.digestWorkspaceHealth.find((item) => item.workspaceId === workspaceId)?.incidentPolicy
        .incidentApprovalCapacityLimit,
      1
    );
    assert.equal(
      listAuditEvents(40).some((event) => event.type === "collaboration:rollback-approval-policy"),
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

test("high-confidence approval recommendations can auto-promote when the environment policy allows it", async () => {
  const snapshot = snapshotFiles(FILES);
  const usersPath = WORKSPACE_USERS_PATH;
  const originalUsers = fs.existsSync(usersPath) ? fs.readFileSync(usersPath, "utf8") : null;
  const workspaceId = "workspace-auto-promote";

  try {
    resetState();
    fs.writeFileSync(
      usersPath,
      JSON.stringify(
        [
          { id: "admin", name: "Admin User", email: "admin@example.com", role: "admin", workspaceId, workspaceName: "Auto Promote", status: "active" },
          { id: "pat", name: "Pat Approver", email: "pat@example.com", role: "approver", workspaceId, workspaceName: "Auto Promote", status: "active" },
          { id: "alex", name: "Alex Backup", email: "alex@example.com", role: "approver", workspaceId, workspaceName: "Auto Promote", status: "active" },
        ],
        null,
        2
      ),
      "utf8"
    );

    await handleConsoleRequest(
      {
        action: "collaboration:update-governance",
        payload: {
          currentEnvironment: "production",
          environmentPolicies: {
            production: {
              minimumRoleForCommands: "operator",
              minimumRoleForApprovals: "approver",
              minimumRoleForGovernance: "admin",
              requireChecklistForResolved: true,
              requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
              requireSummaryShareBeforeArchived: true,
              requireApprovalForResolved: true,
              requireApprovalForArchived: true,
              incidentApprovalReminderMinutes: 5,
              incidentApprovalEscalationMinutes: 10,
              incidentApprovalEscalationTarget: "role:admin",
              incidentApprovalFinalEscalationMinutes: 15,
              incidentApprovalFinalEscalationTarget: "team",
              incidentApprovalCapacityLimit: 2,
              autoPromoteApprovalRecommendations: true,
              autoPromoteRecommendationConfidence: 0.5,
              autoPromoteObservationHours: 1,
              autoPromoteCooldownHours: 12,
            },
          },
        },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", bypassApproval: true }
    );

    await handleConsoleRequest(
      { action: "collaboration:automation-assign", payload: { workspaceId, owner: "Jamie Lead" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-assign-approver", payload: { workspaceId, approverTarget: "user:pat" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-create-followup", payload: { workspaceId, owner: "Jamie Lead", description: "Build auto-promote pressure." } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-generate-summary", payload: { workspaceId } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    await handleConsoleRequest(
      { action: "collaboration:automation-share-summary", payload: { workspaceId, assignedTo: "team" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    const requested = await handleConsoleRequest(
      { action: "collaboration:automation-set-status", payload: { workspaceId, incidentStatus: "resolved" } },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    const approvalId = requested.overview.collaboration.approvals.find((item) => item.payload?.workspaceId === workspaceId)?.id;
    assert.ok(approvalId);
    const state = loadCollaborationState();
    state.approvals[0].createdAt = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    saveCollaborationState(state);
    await handleConsoleRequest(
      { action: "approval:approve", payload: { approvalId } },
      { userId: "pat", userName: "Pat Approver", userRole: "approver", workspaceId }
    );

    const firstOverview = await handleConsoleRequest(
      { command: "help" },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    assert.equal(firstOverview.overview.collaboration.governance.appliedApprovalPolicies.length, 0);
    assert.equal(firstOverview.overview.collaboration.approvalTrustDashboard.observingCount >= 1, true);
    assert.equal(firstOverview.overview.collaboration.approvalTrustDashboard.score >= 0, true);
    assert.equal(
      firstOverview.overview.collaboration.approvalTrustEnvironments.some(
        (item) => item.environment === "production" && item.current === true
      ),
      true
    );
    assert.equal(
      firstOverview.overview.collaboration.approvalTrustTrends.some(
        (item) => item.environment === "production" && item.sampleCount >= 1
      ),
      true
    );
    const observedRecommendation = firstOverview.overview.collaboration.approvalRecommendationObservations.find(
      (item) => item.status === "observing" || item.status === "watching"
    );
    assert.ok(observedRecommendation?.recommendationId);
    const restarted = await handleConsoleRequest(
      {
        action: "collaboration:restart-approval-recommendation-observation",
        payload: { recommendationId: observedRecommendation.recommendationId },
      },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    assert.equal(restarted.ok, true);
    const restartedObservation = restarted.overview.collaboration.approvalRecommendationObservations.find(
      (item) => item.recommendationId === observedRecommendation.recommendationId
    );
    assert.equal(restartedObservation?.status, "observing");
    const collab = loadCollaborationState();
    collab.governance.approvalRecommendationObservations = (collab.governance.approvalRecommendationObservations || []).map((item) => ({
      ...item,
      eligibleSinceAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    }));
    collab.governance.approvalTrustHistory = (collab.governance.approvalTrustHistory || []).map((item, index) =>
      index === 0
        ? {
            ...item,
            takenAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
            score: Math.max(0, Number(item.score || 0) - 10),
          }
        : item
    );
    saveCollaborationState(collab);

    const overview = await handleConsoleRequest(
      { command: "help" },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );

    assert.equal(
      overview.overview.collaboration.governance.appliedApprovalPolicies.some(
        (item) => item.target === "user:pat" && item.appliedAutomatically === true
      ),
      true
    );
    assert.equal(overview.overview.collaboration.approvalTrustDashboard.score >= 0, true);
    const productionTrend = overview.overview.collaboration.approvalTrustTrends.find((item) => item.environment === "production");
    assert.equal(typeof productionTrend?.deltas.day, "number");
    assert.equal(
      overview.overview.collaboration.approvalTrustSignals.some((item) => item.type === "trust"),
      true
    );
    assert.equal(
      overview.overview.collaboration.inbox.some((item) => item.type === "trust"),
      true
    );
    assert.equal(
      overview.overview.collaboration.approvalRecommendationFamilies.some(
        (item) =>
          item.family === observedRecommendation.recommendationId ||
          item.family === `trust-drop:production` ||
          item.family === `trust-regression:production`
      ),
      true
    );
    assert.equal(
      listAuditEvents(50).some(
        (event) =>
          event.type === "collaboration:promote-approval-policy-recommendation" &&
          /Automatically promoted/i.test(event.message)
      ),
      true
    );
    const trustReport = await handleConsoleRequest(
      { command: "trust:report" },
      { userId: "admin", userName: "Admin User", userRole: "admin", workspaceId }
    );
    assert.equal(String(trustReport.output || "").includes("Trust report"), true);
    assert.equal(String(trustReport.output || "").includes("Recommendation families"), true);
  } finally {
    if (originalUsers === null) {
      if (fs.existsSync(usersPath)) fs.unlinkSync(usersPath);
    } else {
      fs.writeFileSync(usersPath, originalUsers, "utf8");
    }
    restoreFiles(snapshot);
  }
});

