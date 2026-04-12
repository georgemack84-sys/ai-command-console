const { resolvePayloadValues, assignWorkspaceOwner, assignIncidentApprover, assignBackupApprover } = require("./legacyConsoleAutomationWorkspaceActions");

function snoozeWorkspace(workspaceId, minutes, actor, deps, message) {
  const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  deps.updateDigestWorkspaceState(workspaceId, {
    snoozedUntil,
    snoozedBy: actor.id,
    snoozedAt: new Date().toISOString(),
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "escalation-snoozed",
    message,
    actorId: actor.id,
    actorName: actor.name,
    note: snoozedUntil,
  });
  return snoozedUntil;
}

function queueWorkspaceSweep(workspaceId, actor, deps, message, allowExisting = false) {
  if (!allowExisting) {
    const existing = deps.listJobs(200).some(
      (job) =>
        job.type === "digest:run-due" &&
        ["queued", "running"].includes(job.status) &&
        String(job.payload?.workspace || "") === workspaceId
    );
    if (existing) {
      return null;
    }
  }

  const job = deps.enqueueJob("digest:run-due", { workspace: workspaceId }, actor);
  deps.updateDigestWorkspaceState(workspaceId, {
    lastSweepQueuedAt: new Date().toISOString(),
    queuedBy: actor.id,
    snoozedUntil: null,
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "sweep-queued",
    message,
    actorId: actor.id,
    actorName: actor.name,
    note: job.id,
  });
  return job;
}

function createWorkspaceFollowup(workspaceId, workspaceName, payload, actor, deps, options = {}) {
  const owner = String(options.owner || payload.owner || "").trim() || actor.name;
  const agentName = String(payload.agentName || "planner").trim();
  const defaultDescription = `Investigate automation escalation for workspace ${workspaceId} and report the next remediation step.`;
  const template = String(payload.description || defaultDescription).trim();
  const description = template
    .replaceAll("{{workspaceId}}", workspaceId)
    .replaceAll("{{workspaceName}}", workspaceName || workspaceId);
  const task = deps.addTask(agentName, description, {
    priority: Number(payload.priority || 2),
    sourceAgent: "automation-escalation",
    delegationReason: options.delegationReason || `Created from automation escalation for workspace ${workspaceId}.`,
    tags: options.tags || ["automation-escalation", "workspace-ops"],
    callbackEnabled: true,
    notifyAgent: "manager",
    workspaceId,
    linkedWorkspaceId: workspaceId,
    linkedInboxItemId: String(payload.itemId || ""),
    ownerId: actor.id,
    ownerName: owner,
  });
  const eventMessage = String(options.eventMessage || `Created automation follow-up task ${task.id}.`).replaceAll(
    "{{taskId}}",
    task.id
  );
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "followup-created",
    message: eventMessage,
    actorId: actor.id,
    actorName: actor.name,
    note: description,
  });
  deps.updateIncidentChecklistItem(workspaceId, "followup_created", {
    completed: true,
    completedAt: new Date().toISOString(),
    completedByName: actor.name,
  });
  return { task, owner, agentName, description };
}

function createBulkWorkspaceFollowups(targets, payload, actor, deps, options = {}) {
  return targets.map((workspaceHealth) =>
    createWorkspaceFollowup(workspaceHealth.workspaceId, workspaceHealth.workspaceName, payload, actor, deps, {
      owner: options.owner,
      delegationReason:
        options.delegationReason ||
        `Created from control-plane bulk follow-up for workspace ${workspaceHealth.workspaceId}.`,
      tags: options.tags || ["automation-escalation", "workspace-ops", "bulk-followup"],
      eventMessage: options.eventMessage || `Created automation follow-up task {{taskId}} from the control plane.`,
    })
  );
}

function runStabilizationPlaybook(targets, payload, actor, deps) {
  const owner = String(payload.owner || "").trim();
  const approverTarget = String(payload.approverTarget || "").trim();
  const backupApproverTarget = String(payload.backupApproverTarget || "").trim();
  const createFollowup = Boolean(payload.createFollowup);
  const queueSweep = payload.queueSweep !== false;
  const followupOwner = owner || actor.name;
  const jobs = [];
  const tasks = [];

  targets.forEach((workspaceHealth) => {
    if (owner) {
      assignWorkspaceOwner(
        workspaceHealth.workspaceId,
        owner,
        actor,
        deps,
        "Assigned {owner} as workspace automation owner from the stabilization playbook."
      );
    }

    if (approverTarget || payload.approverTarget === "") {
      assignIncidentApprover(
        workspaceHealth.workspaceId,
        approverTarget,
        actor,
        deps,
        approverTarget
          ? `Assigned ${approverTarget} as the required incident approver from the stabilization playbook.`
          : "Cleared the required incident approver from the stabilization playbook."
      );
    }

    if (backupApproverTarget || payload.backupApproverTarget === "") {
      assignBackupApprover(
        workspaceHealth.workspaceId,
        backupApproverTarget,
        actor,
        deps,
        backupApproverTarget
          ? `Assigned ${backupApproverTarget} as the backup incident approver from the stabilization playbook.`
          : "Cleared the backup incident approver from the stabilization playbook."
      );
    }

    if (queueSweep) {
      const job = queueWorkspaceSweep(workspaceHealth.workspaceId, actor, deps, "Queued a stabilization digest sweep.");
      if (job) {
        jobs.push(job);
      }
    }

    if (createFollowup) {
      const { task } = createWorkspaceFollowup(workspaceHealth.workspaceId, workspaceHealth.workspaceName, payload, actor, deps, {
        owner: followupOwner,
        delegationReason: `Created from stabilization playbook for workspace ${workspaceHealth.workspaceId}.`,
        tags: ["automation-escalation", "workspace-ops", "stabilize-playbook"],
        eventMessage: "Created automation follow-up task {{taskId}} from the stabilization playbook.",
      });
      tasks.push(task);
    }
  });

  return { owner, approverTarget, backupApproverTarget, queueSweep, createFollowup, jobs, tasks };
}

module.exports = {
  resolvePayloadValues,
  snoozeWorkspace,
  queueWorkspaceSweep,
  createWorkspaceFollowup,
  createBulkWorkspaceFollowups,
  runStabilizationPlaybook,
};
