const {
  resolvePayloadValues,
  assignWorkspaceOwner,
  assignIncidentApprover,
  assignBackupApprover,
  applyWorkspacePolicyOverride,
  resetWorkspacePolicyOverride,
  savePolicyPlaybook,
  deletePolicyPlaybook,
} = require("./legacyConsoleAutomationWorkspaceActions");
const {
  snoozeWorkspace,
  queueWorkspaceSweep,
  createWorkspaceFollowup,
  createBulkWorkspaceFollowups,
  runStabilizationPlaybook,
} = require("./legacyConsoleAutomationExecutionActions");
const {
  addWorkspaceAutomationNote,
  generateIncidentSummary,
  setIncidentStatus,
  toggleIncidentChecklistItem,
  shareIncidentSummary,
} = require("./legacyConsoleAutomationIncidentActions");

async function handleLegacyAutomationAction({
  action,
  payload = {},
  options = {},
  workspace,
  actor,
  deps,
}) {
  const {
    parseAutomationInboxItem,
    updateDigestWorkspaceState,
    updateIncidentChecklistItem,
    appendDigestWorkspaceEvent,
    getDigestSchedulerStatus,
    buildDigestWorkspaceHealth,
    selectBulkAutomationWorkspaces,
    loadCollaborationState,
    updateGovernance,
    normalizePolicyPlaybookPayload,
    summarizeWorkspacePolicyOverride,
    executeAction,
    listJobs,
    enqueueJob,
    addTask,
    listAutomationFollowups,
    generateWorkspaceIncidentSummary,
    createHandoff,
    validateIncidentStatusChange,
    appendAuditEvent,
    buildOverview,
  } = deps;

  if (action === "collaboration:automation-assign") {
    const workspaceId = String(payload.workspaceId || parseAutomationInboxItem(payload.itemId)?.workspaceId || "");
    const owner = String(payload.owner || "").trim();
    if (!workspaceId || !owner) {
      return { ok: false, error: "Workspace and owner are required.", overview: buildOverview(options) };
    }
    assignWorkspaceOwner(workspaceId, owner, actor, {
      updateDigestWorkspaceState,
      updateIncidentChecklistItem,
      appendDigestWorkspaceEvent,
    });
    appendAuditEvent({ type: action, message: `Assigned automation owner for ${workspaceId}.`, payload: { workspaceId, owner, actorId: actor.id } });
    return { ok: true, output: `Assigned ${owner} to ${workspaceId}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-bulk-assign") {
    const owner = String(payload.owner || "").trim();
    if (!owner) {
      return { ok: false, error: "An owner is required.", overview: buildOverview(options) };
    }
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    targets.forEach((workspaceHealth) => {
      assignWorkspaceOwner(
        workspaceHealth.workspaceId,
        owner,
        actor,
        {
          updateDigestWorkspaceState,
          updateIncidentChecklistItem,
          appendDigestWorkspaceEvent,
        },
        "Assigned {owner} as workspace automation owner from the control plane."
      );
    });
    const { environments, statuses } = resolvePayloadValues(payload);
    appendAuditEvent({
      type: action,
      message: `Assigned automation owner ${owner} across ${targets.length} workspaces.`,
      payload: {
        workspaceIds: targets.map((item) => item.workspaceId),
        owner,
        actorId: actor.id,
        environments,
        statuses,
      },
    });
    return { ok: true, output: `Assigned ${owner} to ${targets.length} matching workspaces.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-assign-approver") {
    const workspaceId = String(payload.workspaceId || "");
    const approverTarget = String(payload.approverTarget || "").trim();
    if (!workspaceId) {
      return { ok: false, error: "Workspace is required.", overview: buildOverview(options) };
    }
    assignIncidentApprover(
      workspaceId,
      approverTarget,
      actor,
      { updateDigestWorkspaceState, appendDigestWorkspaceEvent },
      approverTarget ? `Assigned ${approverTarget} as the required incident approver.` : "Cleared the required incident approver."
    );
    appendAuditEvent({
      type: action,
      message: `${approverTarget ? "Assigned" : "Cleared"} incident approver target for ${workspaceId}.`,
      payload: { workspaceId, approverTarget: approverTarget || null, actorId: actor.id },
    });
    return {
      ok: true,
      output: approverTarget ? `Assigned ${approverTarget} as the incident approver for ${workspaceId}.` : `Cleared the incident approver for ${workspaceId}.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-bulk-assign-approver") {
    const approverTarget = String(payload.approverTarget || "").trim();
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    targets.forEach((workspaceHealth) => {
      assignIncidentApprover(
        workspaceHealth.workspaceId,
        approverTarget,
        actor,
        { updateDigestWorkspaceState, appendDigestWorkspaceEvent },
        approverTarget
          ? `Assigned ${approverTarget} as the required incident approver from the control plane.`
          : "Cleared the required incident approver from the control plane."
      );
    });
    const { environments, statuses } = resolvePayloadValues(payload);
    appendAuditEvent({
      type: action,
      message: `${approverTarget ? "Assigned" : "Cleared"} required incident approver across ${targets.length} workspaces.`,
      payload: {
        workspaceIds: targets.map((item) => item.workspaceId),
        approverTarget: approverTarget || null,
        actorId: actor.id,
        environments,
        statuses,
      },
    });
    return {
      ok: true,
      output: approverTarget
        ? `Assigned ${approverTarget} as the incident approver for ${targets.length} matching workspaces.`
        : `Cleared the incident approver for ${targets.length} matching workspaces.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-assign-backup-approver") {
    const workspaceId = String(payload.workspaceId || "");
    const backupApproverTarget = String(payload.backupApproverTarget || "").trim();
    if (!workspaceId) {
      return { ok: false, error: "Workspace is required.", overview: buildOverview(options) };
    }
    assignBackupApprover(
      workspaceId,
      backupApproverTarget,
      actor,
      { updateDigestWorkspaceState, appendDigestWorkspaceEvent },
      backupApproverTarget ? `Assigned ${backupApproverTarget} as the backup incident approver.` : "Cleared the backup incident approver."
    );
    appendAuditEvent({
      type: action,
      message: `${backupApproverTarget ? "Assigned" : "Cleared"} backup incident approver target for ${workspaceId}.`,
      payload: { workspaceId, backupApproverTarget: backupApproverTarget || null, actorId: actor.id },
    });
    return {
      ok: true,
      output: backupApproverTarget
        ? `Assigned ${backupApproverTarget} as the backup incident approver for ${workspaceId}.`
        : `Cleared the backup incident approver for ${workspaceId}.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-bulk-assign-backup-approver") {
    const backupApproverTarget = String(payload.backupApproverTarget || "").trim();
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    targets.forEach((workspaceHealth) => {
      assignBackupApprover(
        workspaceHealth.workspaceId,
        backupApproverTarget,
        actor,
        { updateDigestWorkspaceState, appendDigestWorkspaceEvent },
        backupApproverTarget
          ? `Assigned ${backupApproverTarget} as the backup incident approver from the control plane.`
          : "Cleared the backup incident approver from the control plane."
      );
    });
    const { environments, statuses } = resolvePayloadValues(payload);
    appendAuditEvent({
      type: action,
      message: `${backupApproverTarget ? "Assigned" : "Cleared"} backup incident approver across ${targets.length} workspaces.`,
      payload: {
        workspaceIds: targets.map((item) => item.workspaceId),
        backupApproverTarget: backupApproverTarget || null,
        actorId: actor.id,
        environments,
        statuses,
      },
    });
    return {
      ok: true,
      output: backupApproverTarget
        ? `Assigned ${backupApproverTarget} as the backup incident approver for ${targets.length} matching workspaces.`
        : `Cleared the backup incident approver for ${targets.length} matching workspaces.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-bulk-apply-policy-override") {
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    const { overrideTemplate, workspaceIds } = applyWorkspacePolicyOverride(targets, payload, actor, {
      loadCollaborationState,
      updateGovernance,
      appendDigestWorkspaceEvent,
      summarizeWorkspacePolicyOverride,
    });
    const { environments, statuses } = resolvePayloadValues(payload);
    appendAuditEvent({
      type: action,
      message: `Applied workspace policy override across ${targets.length} workspaces.`,
      payload: {
        actorId: actor.id,
        environments,
        statuses,
        workspaceIds,
        override: overrideTemplate,
      },
    });
    return {
      ok: true,
      output: `Applied a workspace policy override across ${targets.length} matching workspaces.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-bulk-reset-policy-override") {
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    const { workspaceIds } = resetWorkspacePolicyOverride(targets, actor, {
      loadCollaborationState,
      updateGovernance,
      appendDigestWorkspaceEvent,
    });
    const { environments, statuses } = resolvePayloadValues(payload);
    appendAuditEvent({
      type: action,
      message: `Cleared workspace policy override across ${targets.length} workspaces.`,
      payload: {
        actorId: actor.id,
        environments,
        statuses,
        workspaceIds,
      },
    });
    return {
      ok: true,
      output: `Cleared workspace policy overrides across ${targets.length} matching workspaces.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:save-policy-playbook") {
    const normalized = savePolicyPlaybook(payload, actor, {
      loadCollaborationState,
      updateGovernance,
      normalizePolicyPlaybookPayload,
    });
    if (!normalized.ok) {
      return { ok: false, error: normalized.error, overview: buildOverview(options) };
    }
    appendAuditEvent({
      type: action,
      message: `Saved workspace policy playbook ${normalized.playbook.name}.`,
      payload: { actorId: actor.id, playbook: normalized.playbook },
    });
    return { ok: true, output: `Saved policy playbook ${normalized.playbook.name}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:delete-policy-playbook") {
    const deleted = deletePolicyPlaybook(payload, {
      loadCollaborationState,
      updateGovernance,
    });
    if (!deleted.ok) {
      return { ok: false, error: deleted.error, overview: buildOverview(options) };
    }
    appendAuditEvent({
      type: action,
      message: `Deleted workspace policy playbook ${deleted.target.name}.`,
      payload: { actorId: actor.id, playbookId: deleted.playbookId },
    });
    return { ok: true, output: `Deleted policy playbook ${deleted.target.name}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-bulk-apply-policy-playbook") {
    const collaboration = loadCollaborationState();
    const playbooks = Array.isArray(collaboration.governance?.workspacePolicyPlaybooks)
      ? collaboration.governance.workspacePolicyPlaybooks
      : [];
    const playbookId = String(payload.playbookId || "").trim();
    const playbook = playbooks.find((item) => String(item.id) === playbookId);
    if (!playbook) {
      return { ok: false, error: "Policy playbook not found.", overview: buildOverview(options) };
    }
    const targets = selectBulkAutomationWorkspaces(buildDigestWorkspaceHealth(getDigestSchedulerStatus()), {
      environment: payload.environment,
      environments: payload.environments,
      statuses: payload.statuses,
    });
    const result = await executeAction(
      "collaboration:automation-bulk-apply-policy-override",
      {
        ...payload,
        overrideEnvironment: playbook.environment,
        incidentApprovalCapacityLimit: playbook.incidentApprovalCapacityLimit,
        trustDropAction: playbook.trustDropAction,
        requireApprovalForResolved: playbook.requireApprovalForResolved,
        promoteTrustDropToIncident: playbook.promoteTrustDropToIncident,
      },
      options
    );
    if (!result.ok) {
      return result;
    }
    const refreshed = loadCollaborationState();
    const governance = refreshed.governance || {};
    const rollout = {
      id: `policy_playbook_rollout_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      playbookId: playbook.id,
      playbookName: playbook.name,
      environment: String(payload.environment || payload.environments?.[0] || playbook.environment || "development"),
      workspaceCount: targets.length,
      workspaceIds: targets.map((item) => item.workspaceId),
      workspaceNames: targets.map((item) => item.workspaceName),
      appliedAt: new Date().toISOString(),
      appliedById: actor.id,
      appliedByName: actor.name,
    };
    updateGovernance({
      ...governance,
      workspacePolicyPlaybookRollouts: [
        rollout,
        ...(Array.isArray(governance.workspacePolicyPlaybookRollouts)
          ? governance.workspacePolicyPlaybookRollouts
          : []),
      ],
    });
    appendAuditEvent({
      type: action,
      message: `Applied workspace policy playbook ${playbook.name} across ${targets.length} workspaces.`,
      payload: {
        actorId: actor.id,
        playbookId: playbook.id,
        environment: rollout.environment,
        workspaceIds: rollout.workspaceIds,
      },
    });
    return { ok: true, output: `Applied policy playbook ${playbook.name} across ${targets.length} matching workspaces.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-snooze") {
    const workspaceId = String(payload.workspaceId || parseAutomationInboxItem(payload.itemId)?.workspaceId || "");
    const minutes = Math.max(5, Number(payload.minutes || 60));
    if (!workspaceId) {
      return { ok: false, error: "Workspace is required.", overview: buildOverview(options) };
    }
    snoozeWorkspace(
      workspaceId,
      minutes,
      actor,
      { updateDigestWorkspaceState, appendDigestWorkspaceEvent },
      `Snoozed workspace automation escalation for ${minutes} minutes.`
    );
    appendAuditEvent({ type: action, message: `Snoozed automation escalation for ${workspaceId}.`, payload: { workspaceId, minutes, actorId: actor.id } });
    return { ok: true, output: `Snoozed ${workspaceId} for ${minutes} minutes.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-bulk-snooze") {
    const minutes = Math.max(5, Number(payload.minutes || 60));
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    const { environments, statuses } = resolvePayloadValues(payload);
    let snoozedUntil = null;
    targets.forEach((workspaceHealth) => {
      snoozedUntil = snoozeWorkspace(
        workspaceHealth.workspaceId,
        minutes,
        actor,
        { updateDigestWorkspaceState, appendDigestWorkspaceEvent },
        `Snoozed workspace automation escalation for ${minutes} minutes from the control plane.`
      );
    });
    appendAuditEvent({
      type: action,
      message: `Snoozed ${targets.length} workspace escalations from the control plane.`,
      payload: {
        workspaceIds: targets.map((item) => item.workspaceId),
        minutes,
        snoozedUntil,
        actorId: actor.id,
        environments,
        statuses,
      },
    });
    return { ok: true, output: `Snoozed ${targets.length} matching workspaces for ${minutes} minutes.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-run-sweep") {
    const targetWorkspace = String(payload.workspaceId || parseAutomationInboxItem(payload.itemId)?.workspaceId || workspace);
    const job = queueWorkspaceSweep(
      targetWorkspace,
      actor,
      { enqueueJob, updateDigestWorkspaceState, appendDigestWorkspaceEvent, listJobs },
      "Queued a manual digest sweep.",
      true
    );
    appendAuditEvent({ type: action, message: `Queued automation sweep for ${targetWorkspace}.`, payload: { workspaceId: targetWorkspace, actorId: actor.id, jobId: job.id } });
    return { ok: true, output: `Queued automation sweep for ${targetWorkspace} as ${job.id}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-bulk-run-sweep") {
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    const { environments, statuses } = resolvePayloadValues(payload);
    const jobs = targets
      .map((workspaceHealth) =>
        queueWorkspaceSweep(
          workspaceHealth.workspaceId,
          actor,
          { enqueueJob, updateDigestWorkspaceState, appendDigestWorkspaceEvent, listJobs },
          "Queued a bulk digest sweep from the control plane."
        )
      )
      .filter(Boolean);
    appendAuditEvent({
      type: action,
      message: `Queued ${jobs.length} bulk automation sweeps.`,
      payload: {
        actorId: actor.id,
        environments,
        statuses,
        workspaceIds: targets.map((item) => item.workspaceId),
        jobIds: jobs.map((item) => item.id),
      },
    });
    return {
      ok: true,
      output: `Queued ${jobs.length} automation sweeps across ${targets.length} matching workspaces.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-bulk-create-followup") {
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    const owner = String(payload.owner || "").trim() || actor.name;
    const agentName = String(payload.agentName || "planner").trim();
    const { environments, statuses } = resolvePayloadValues(payload);
    const tasks = createBulkWorkspaceFollowups(targets, payload, actor, {
      addTask,
      appendDigestWorkspaceEvent,
      updateIncidentChecklistItem,
    }, { owner }).map((item) => item.task);
    appendAuditEvent({
      type: action,
      message: `Created ${tasks.length} automation follow-up tasks from the control plane.`,
      payload: {
        actorId: actor.id,
        owner,
        agentName,
        environments,
        statuses,
        workspaceIds: targets.map((item) => item.workspaceId),
        taskIds: tasks.map((item) => item.id),
      },
    });
    return {
      ok: true,
      output: `Created ${tasks.length} follow-up tasks across ${targets.length} matching workspaces.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-bulk-stabilize") {
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    const { environments, statuses } = resolvePayloadValues(payload);
    const { owner, approverTarget, backupApproverTarget, queueSweep, createFollowup, jobs, tasks } =
      runStabilizationPlaybook(
        targets,
        payload,
        actor,
        {
          updateDigestWorkspaceState,
          updateIncidentChecklistItem,
          appendDigestWorkspaceEvent,
          addTask,
          enqueueJob,
          listJobs,
        }
      );

    appendAuditEvent({
      type: action,
      message: `Ran stabilization playbook across ${targets.length} workspaces.`,
      payload: {
        actorId: actor.id,
        workspaceIds: targets.map((item) => item.workspaceId),
        environments,
        statuses,
        owner: owner || null,
        approverTarget: approverTarget || null,
        backupApproverTarget: backupApproverTarget || null,
        queueSweep,
        createFollowup,
        jobIds: jobs.map((item) => item.id),
        taskIds: tasks.map((item) => item.id),
      },
    });

    return {
      ok: true,
      output: `Stabilized ${targets.length} matching workspaces with ${jobs.length} sweeps and ${tasks.length} follow-up tasks.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-create-followup") {
    const targetWorkspace = String(payload.workspaceId || parseAutomationInboxItem(payload.itemId)?.workspaceId || workspace);
    const description = String(payload.description || `Investigate automation escalation for workspace ${targetWorkspace} and report the next remediation step.`).trim();
    if (!targetWorkspace || !description) {
      return { ok: false, error: "Workspace and description are required.", overview: buildOverview(options) };
    }
    const { task, owner, agentName } = createWorkspaceFollowup(
      targetWorkspace,
      targetWorkspace,
      payload,
      actor,
      { addTask, appendDigestWorkspaceEvent, updateIncidentChecklistItem }
    );
    appendAuditEvent({
      type: action,
      message: `Created automation follow-up task ${task.id} for ${targetWorkspace}.`,
      summary: description,
      payload: { workspaceId: targetWorkspace, actorId: actor.id, taskId: task.id, owner, agentName },
    });
    return { ok: true, output: `Created follow-up task ${task.id} for ${targetWorkspace}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-add-note") {
    const workspaceId = String(payload.workspaceId || "");
    const note = String(payload.note || "").trim();
    if (!workspaceId || !note) {
      return { ok: false, error: "Workspace and note are required.", overview: buildOverview(options) };
    }
    const result = addWorkspaceAutomationNote(workspaceId, note, actor, {
      appendDigestWorkspaceEvent,
    });
    appendAuditEvent({ type: action, ...result.audit, payload: { ...result.audit.payload, actorId: actor.id } });
    return { ok: result.ok, output: result.output, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-generate-summary") {
    const workspaceId = String(payload.workspaceId || "");
    if (!workspaceId) {
      return { ok: false, error: "Workspace is required.", overview: buildOverview(options) };
    }
    const result = generateIncidentSummary(workspaceId, actor, {
      getDigestSchedulerStatus,
      buildDigestWorkspaceHealth,
      listAutomationFollowups,
      generateWorkspaceIncidentSummary,
      updateDigestWorkspaceState,
      updateIncidentChecklistItem,
      appendDigestWorkspaceEvent,
    });
    if (!result.ok) {
      return { ok: false, error: result.error, overview: buildOverview(options) };
    }
    appendAuditEvent({ type: action, ...result.audit, payload: { ...result.audit.payload, actorId: actor.id } });
    return { ok: true, output: result.output, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-set-status") {
    const workspaceId = String(payload.workspaceId || "");
    const incidentStatus = String(payload.incidentStatus || "").trim() || "open";
    const result = setIncidentStatus(workspaceId, incidentStatus, actor, {
      loadCollaborationState,
      validateIncidentStatusChange,
      updateDigestWorkspaceState,
      appendDigestWorkspaceEvent,
    });
    if (!result.ok) {
      return { ok: false, error: result.error, overview: buildOverview(options) };
    }
    appendAuditEvent({ type: action, ...result.audit, payload: { ...result.audit.payload, actorId: actor.id } });
    return { ok: true, output: result.output, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-checklist-toggle") {
    const workspaceId = String(payload.workspaceId || "");
    const itemId = String(payload.itemId || "");
    const completed = Boolean(payload.completed);
    if (!workspaceId || !itemId) {
      return { ok: false, error: "Workspace and checklist item are required.", overview: buildOverview(options) };
    }
    const result = toggleIncidentChecklistItem(workspaceId, itemId, completed, actor, {
      updateIncidentChecklistItem,
      appendDigestWorkspaceEvent,
    });
    appendAuditEvent({ type: action, ...result.audit, payload: { ...result.audit.payload, actorId: actor.id } });
    return { ok: true, output: result.output, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-share-summary") {
    const workspaceId = String(payload.workspaceId || "");
    const assignedTo = String(payload.assignedTo || "team").trim();
    const useHandoffDraft = Boolean(payload.useHandoffDraft);
    if (!workspaceId) {
      return { ok: false, error: "Workspace is required.", overview: buildOverview(options) };
    }
    const result = shareIncidentSummary(workspaceId, assignedTo, useHandoffDraft, actor, {
      getDigestSchedulerStatus,
      buildDigestWorkspaceHealth,
      listAutomationFollowups,
      generateWorkspaceIncidentSummary,
      createHandoff,
      updateDigestWorkspaceState,
      updateIncidentChecklistItem,
      appendDigestWorkspaceEvent,
    });
    if (!result.ok) {
      return { ok: false, error: result.error, overview: buildOverview(options) };
    }
    appendAuditEvent({ type: action, ...result.audit, payload: { ...result.audit.payload, actorId: actor.id } });
    return { ok: true, output: result.output, overview: buildOverview(options) };
  }

  return null;
}

module.exports = {
  handleLegacyAutomationAction,
};
