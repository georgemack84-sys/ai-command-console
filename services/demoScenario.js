function listDemoScenarios() {
  return [
    {
      id: "control-plane",
      name: "Control Plane Story",
      description: "Production is unhealthy, staging recovered, and labs remains noisy for stabilization and playbook guidance.",
    },
    {
      id: "approval-bottleneck",
      name: "Approval Bottleneck",
      description: "Production and labs are waiting on closeout approval to demonstrate escalations and approver pressure.",
    },
    {
      id: "recovery-success",
      name: "Recovery Success",
      description: "Most workspaces are healthy and resolved so the demo can focus on trust recovery and rollout wins.",
    },
    {
      id: "cross-workspace-overload",
      name: "Cross-Workspace Overload",
      description: "Multiple workspaces are unhealthy at once to highlight the global control plane and bulk remediation actions.",
    },
  ];
}

function getScenarioMeta(scenarioId) {
  return listDemoScenarios().find((item) => item.id === scenarioId) || listDemoScenarios()[0];
}

function buildDemoScenarioSeed(scenarioId, actors, now) {
  const meta = getScenarioMeta(scenarioId);
  const {
    demoAdmin,
    prodOperator,
    prodApprover,
    stagingOperator,
    labsOperator,
  } = actors;

  const base = {
    governance: {
      demoScenario: {
        id: meta.id,
        name: meta.name,
        description: meta.description,
      },
      sensitiveActionsRequireApproval: true,
      currentEnvironment: "development",
      workspacePolicyOverrides: {
        "ws-prod-redwood": {
          environment: "production",
          incidentApprovalCapacityLimit: 1,
          trustDropAction: "followup",
          requireApprovalForResolved: true,
          promoteTrustDropToIncident: true,
        },
        "ws-staging-orbit": {
          environment: "staging",
          incidentApprovalCapacityLimit: 2,
          trustDropAction: "digest",
          requireApprovalForResolved: true,
          promoteTrustDropToIncident: false,
        },
      },
      workspacePolicyPlaybooks: [
        {
          id: "playbook_labs_recovery",
          name: "Labs Recovery Sprint",
          environment: "development",
          incidentApprovalCapacityLimit: 2,
          trustDropAction: "digest",
          requireApprovalForResolved: true,
          promoteTrustDropToIncident: false,
          updatedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
          updatedById: demoAdmin.id,
          updatedByName: demoAdmin.name,
        },
      ],
      workspacePolicyPlaybookRollouts: [
        {
          id: "rollout_staging_watch_demo",
          playbookId: "preset_staging_watch",
          playbookName: "Staging Watch",
          environment: "staging",
          workspaceCount: 1,
          workspaceIds: ["ws-staging-orbit"],
          workspaceNames: ["Staging Orbit"],
          appliedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          appliedById: demoAdmin.id,
          appliedByName: demoAdmin.name,
        },
        {
          id: "rollout_labs_recovery_demo",
          playbookId: "playbook_labs_recovery",
          playbookName: "Labs Recovery Sprint",
          environment: "development",
          workspaceCount: 1,
          workspaceIds: ["ws-labs-signal"],
          workspaceNames: ["Labs Signal"],
          appliedAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
          appliedById: demoAdmin.id,
          appliedByName: demoAdmin.name,
        },
      ],
    },
    briefs: {
      "ws-prod-redwood": [
        {
          id: "brief-prod-recovery",
          title: "Production Redwood incident recovery review",
          question: "Which operational changes should we make after the latest production digest failure?",
          status: "in_review",
          priority: "high",
          assignedAgent: "planner",
          tags: ["production", "incident", "recovery"],
          createdAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
          summary: "Collecting remediation options after repeated trust-drop digests in production.",
          linkedTaskId: null,
          ownerId: prodOperator.id,
          ownerName: prodOperator.name,
        },
      ],
      "ws-staging-orbit": [
        {
          id: "brief-staging-watch",
          title: "Staging Orbit digest watch recap",
          question: "What did the staging watch rollout fix, and what should we standardize?",
          status: "complete",
          priority: "medium",
          assignedAgent: "researcher",
          tags: ["staging", "watch", "playbook"],
          createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
          summary: "Recovered successfully under the staging watch preset.",
          linkedTaskId: null,
          ownerId: stagingOperator.id,
          ownerName: stagingOperator.name,
        },
      ],
    },
    reports: {
      "ws-prod-redwood": [
        {
          id: "report-prod-recovery",
          briefId: "brief-prod-recovery",
          title: "Production Redwood recovery memo",
          format: "memo",
          status: "draft",
          createdAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
          excerpt: "Production Redwood needs a stricter recovery posture and clearer approval routing.",
          keyFindings: [
            "Use a stricter production recovery preset.",
            "Keep approval capacity low for production incidents.",
          ],
          ownerId: prodOperator.id,
          ownerName: prodOperator.name,
        },
      ],
      "ws-staging-orbit": [
        {
          id: "report-staging-watch",
          briefId: "brief-staging-watch",
          title: "Staging watch rollout recap",
          format: "memo",
          status: "ready",
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          excerpt: "The staging preset stabilized the cluster with minimal manual intervention.",
          keyFindings: [
            "Digest-heavy monitoring was enough for staging.",
            "No trust incident promotion was needed.",
          ],
          ownerId: stagingOperator.id,
          ownerName: stagingOperator.name,
        },
      ],
    },
    digestWorkspaceState: {
      default: {
        lastSweepRunAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        lastGeneratedCount: 2,
        incidentStatus: "ready_for_closeout",
        escalationOwner: demoAdmin.name,
      },
      "ws-prod-redwood": {
        lastSweepRunAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        lastSweepError: "Digest retries exhausted after trust drop in production.",
        lastGeneratedCount: 0,
        incidentStatus: "open",
        escalationOwner: prodOperator.name,
        incidentApproverTarget: `user:${prodApprover.email}`,
        backupApproverTarget: "role:admin",
      },
      "ws-staging-orbit": {
        lastSweepRunAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
        lastGeneratedCount: 3,
        incidentStatus: "resolved",
        escalationOwner: stagingOperator.name,
        incidentSummary: "Staging Orbit recovered after a staged digest watch rollout and no longer shows elevated trust pressure.",
        incidentSummaryUpdatedAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      },
      "ws-labs-signal": {
        lastSweepRunAt: new Date(now.getTime() - 75 * 60 * 1000).toISOString(),
        lastSweepError: "Policy drift detected during digest generation for Labs Signal.",
        lastGeneratedCount: 0,
        incidentStatus: "open",
        escalationOwner: labsOperator.name,
        incidentSummary: "Labs Signal is still noisy after a saved recovery bundle rollout and needs operator review.",
        incidentSummaryUpdatedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      },
    },
    approvalRequests: [],
  };

  if (meta.id === "approval-bottleneck") {
    base.governance.currentEnvironment = "production";
    base.digestWorkspaceState["ws-prod-redwood"] = {
      ...base.digestWorkspaceState["ws-prod-redwood"],
      incidentStatus: "ready_for_closeout",
      incidentSummary: "Production Redwood is waiting on closeout approval after the latest trust recovery.",
      incidentSummaryUpdatedAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
    };
    base.digestWorkspaceState["ws-labs-signal"] = {
      ...base.digestWorkspaceState["ws-labs-signal"],
      incidentStatus: "ready_for_closeout",
      incidentApproverTarget: `user:${prodApprover.email}`,
      backupApproverTarget: "role:admin",
    };
    base.approvalRequests.push(
      {
        action: "collaboration:automation-set-status",
        label: "Approve incident resolved for Production Redwood",
        approverTarget: `user:${prodApprover.email}`,
        routingMode: "primary",
        routingReason: "Demo approval bottleneck scenario routes both closeouts to the same approver.",
        payload: {
          workspaceId: "ws-prod-redwood",
          incidentStatus: "resolved",
        },
      },
      {
        action: "collaboration:automation-set-status",
        label: "Approve incident resolved for Labs Signal",
        approverTarget: `user:${prodApprover.email}`,
        routingMode: "primary",
        routingReason: "Demo approval bottleneck scenario routes both closeouts to the same approver.",
        payload: {
          workspaceId: "ws-labs-signal",
          incidentStatus: "resolved",
        },
      }
    );
  } else if (meta.id === "recovery-success") {
    base.digestWorkspaceState["ws-prod-redwood"] = {
      ...base.digestWorkspaceState["ws-prod-redwood"],
      lastSweepError: null,
      lastGeneratedCount: 4,
      incidentStatus: "resolved",
      incidentSummary: "Production Redwood recovered after the recovery preset and is ready for archive review.",
      incidentSummaryUpdatedAt: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
    };
    base.digestWorkspaceState["ws-labs-signal"] = {
      ...base.digestWorkspaceState["ws-labs-signal"],
      lastSweepError: null,
      lastGeneratedCount: 2,
      incidentStatus: "resolved",
      incidentSummary: "Labs Signal stabilized after a follow-up rollout and is no longer in active distress.",
      incidentSummaryUpdatedAt: new Date(now.getTime() - 14 * 60 * 1000).toISOString(),
    };
    base.governance.workspacePolicyPlaybookRollouts.push({
      id: "rollout_prod_recovery_demo",
      playbookId: "preset_production_recovery",
      playbookName: "Production Recovery",
      environment: "production",
      workspaceCount: 1,
      workspaceIds: ["ws-prod-redwood"],
      workspaceNames: ["Production Redwood"],
      appliedAt: new Date(now.getTime() - 95 * 60 * 1000).toISOString(),
      appliedById: demoAdmin.id,
      appliedByName: demoAdmin.name,
    });
  } else if (meta.id === "cross-workspace-overload") {
    base.digestWorkspaceState.default = {
      ...base.digestWorkspaceState.default,
      incidentStatus: "open",
      lastSweepError: "Main workspace digest sweep is behind schedule.",
      lastGeneratedCount: 0,
    };
    base.digestWorkspaceState["ws-staging-orbit"] = {
      ...base.digestWorkspaceState["ws-staging-orbit"],
      incidentStatus: "open",
      lastGeneratedCount: 0,
      lastSweepError: "Staging Orbit is falling behind after an alert spike.",
      incidentSummary: "Staging Orbit is no longer fully recovered and needs another stabilization pass.",
    };
  }

  return base;
}

module.exports = {
  listDemoScenarios,
  getScenarioMeta,
  buildDemoScenarioSeed,
};
