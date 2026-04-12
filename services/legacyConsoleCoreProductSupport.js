function runPolicyAction(action, payload, deps) {
  if (action === "policy:update-thresholds") {
    const thresholds = deps.updateAlertThresholds(payload);
    return {
      ok: true,
      output: "Updated alert thresholds.",
      audit: {
        message: "Updated alert thresholds.",
        payload: thresholds,
      },
    };
  }

  if (action === "policy:update-automation") {
    const policy = deps.updateAutomationPolicy({
      escalation: payload.escalation || {},
      remediation: payload.remediation || {},
    });

    if (policy.escalation.autoRunWatcherOnPolicySave) {
      deps.evaluateRules();
    }
    if (policy.escalation.autoRunAlertsOnPolicySave) {
      deps.runAlertChecks();
    }

    return {
      ok: true,
      output: "Updated automation policy.",
      audit: {
        message: "Updated automation policy.",
        payload: policy,
      },
    };
  }

  return null;
}

function updateAgentConfiguration(payload, deps) {
  const agentName = String(payload.agentName || "");
  const profile = deps.updateAgentProfile(agentName, {
    role: payload.role,
    description: payload.description,
    defaultGoal: payload.defaultGoal,
    systemPrompt: payload.systemPrompt,
    maxStepsPerRun: payload.maxStepsPerRun,
    cooldownSeconds: payload.cooldownSeconds,
    allowShellExecution: payload.allowShellExecution,
    allowFileWrite: payload.allowFileWrite,
    allowPlanning: payload.allowPlanning,
    tags: payload.tags,
  });

  return {
    ok: true,
    output: `Updated profile for ${agentName}.`,
    audit: {
      message: `Updated agent profile ${agentName}.`,
      payload: { agentName, profile },
    },
  };
}

function createResearchBrief(workspace, payload, deps) {
  const brief = deps.createBriefRecord(workspace, {
    title: String(payload.title || ""),
    question: String(payload.question || ""),
    assignedAgent: String(payload.assignedAgent || "researcher"),
    priority: String(payload.priority || "medium"),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    summary: String(payload.summary || "Created from the command desk."),
  });

  return {
    ok: true,
    output: deps.formatBriefs([brief]),
    audit: {
      message: `Created research brief ${brief.id}.`,
      summary: brief.title,
      payload: { briefId: brief.id },
    },
  };
}

function runCollaborationCoreAction(action, payload, actor, deps) {
  if (action === "collaboration:share-session") {
    const session = deps.upsertSharedSession({
      id: payload.id,
      name: String(payload.name || "Shared session").trim(),
      draftCommand: String(payload.draftCommand || "").trim(),
      macros: Array.isArray(payload.macros) ? payload.macros : [],
      ownerId: actor.id,
      ownerName: actor.name,
      sharedWith: Array.isArray(payload.sharedWith) ? payload.sharedWith : ["team"],
    });

    return {
      ok: true,
      output: `Shared session "${session.name}".`,
      audit: {
        message: `Shared session ${session.name}.`,
        payload: { sessionId: session.id },
      },
    };
  }

  if (action === "collaboration:create-handoff") {
    const handoff = deps.createHandoff({
      title: String(payload.title || "").trim(),
      note: String(payload.note || "").trim(),
      assignedTo: String(payload.assignedTo || "team").trim(),
      assignedById: actor.id,
      assignedByName: actor.name,
    });

    return {
      ok: true,
      output: `Created handoff "${handoff.title}".`,
      audit: {
        message: `Created handoff ${handoff.title}.`,
        payload: { handoffId: handoff.id },
      },
    };
  }

  if (action === "collaboration:close-handoff") {
    const handoff = deps.closeHandoff(String(payload.handoffId || ""));
    if (!handoff) {
      return { ok: false, error: `Handoff not found: ${payload.handoffId}` };
    }

    return {
      ok: true,
      output: `Closed handoff "${handoff.title}".`,
      audit: {
        message: `Closed handoff ${handoff.title}.`,
        payload: { handoffId: handoff.id },
      },
    };
  }

  return null;
}

module.exports = {
  runPolicyAction,
  updateAgentConfiguration,
  createResearchBrief,
  runCollaborationCoreAction,
};
