function isSensitiveLegacyConsoleAction(action) {
  return [
    "watcher:stop",
    "watcher:rule-delete",
    "alert:resolve",
    "agent:update-config",
    "policy:update-thresholds",
    "policy:update-automation",
  ].includes(action);
}

function requiresLegacyConsoleApproval(action, payload = {}, options = {}, deps) {
  if (options.bypassApproval) {
    return false;
  }

  const collaboration = deps.loadCollaborationState();
  if (Boolean(collaboration.governance?.sensitiveActionsRequireApproval) && isSensitiveLegacyConsoleAction(action)) {
    return true;
  }

  if (action === "collaboration:automation-set-status") {
    return deps.requiresIncidentApproval(payload.incidentStatus, collaboration.governance, payload.workspaceId);
  }

  return false;
}

function createLegacyConsoleRequestHandlers(deps) {
  async function executeCommand(rawCommand, options = {}) {
    return deps.executeLegacyConsoleCommand(rawCommand, options, deps.getCommandDeps());
  }

  async function executeAction(action, payload = {}, options = {}) {
    deps.ensureJobProcessorsRegistered();
    const workspace = deps.getResearchWorkspace(options);
    const actor = deps.getActor(options);

    const coreActionResult = deps.handleLegacyCoreAction({
      action,
      payload,
      options,
      workspace,
      actor,
      deps: deps.getCoreActionDeps(),
    });
    if (coreActionResult) {
      return coreActionResult;
    }

    const collaborationActionResult = deps.handleLegacyCollaborationAction({
      action,
      payload,
      options,
      workspace,
      actor,
      deps: deps.getCollaborationActionDeps(),
    });
    if (collaborationActionResult) {
      return collaborationActionResult;
    }

    const automationActionResult = await deps.handleLegacyAutomationAction({
      action,
      payload,
      options,
      workspace,
      actor,
      deps: deps.getAutomationActionDeps(executeAction),
    });
    if (automationActionResult) {
      return automationActionResult;
    }

    throw new Error(`Unknown action: ${action}`);
  }

  async function handleConsoleRequest(body, options = {}) {
    if ("action" in body && body.action) {
      const action = String(body.action);
      const payload = body.payload || {};
      const actor = deps.getActor(options);
      const startedAt = Date.now();
      const governance = deps.loadCollaborationState().governance;
      const control = await deps.reviewConsoleRequest(body, actor, options);

      if (control.decision.decision === "blocked") {
        return {
          ok: false,
          error: control.decision.explanation,
          control,
          overview: deps.buildOverview(options),
        };
      }

      if (control.decision.decision === "simulate") {
        return {
          ok: true,
          output: control.decision.explanation,
          control,
          plan: control.plan,
          overview: deps.buildOverview(options),
        };
      }

      if (
        !deps.canUseConsoleAction(actor.role, action) ||
        (action.startsWith("approval:") && !deps.canApproveInEnvironment(actor.role, governance)) ||
        (deps.isGovernanceAction(action) && !deps.canManageGovernanceInEnvironment(actor.role, governance))
      ) {
        deps.recordTelemetry({
          type: action,
          status: "error",
          durationMs: Date.now() - startedAt,
          actorId: actor.id,
          meta: { reason: "forbidden", role: actor.role },
        });
        return {
          ok: false,
          error: `Role "${actor.role}" is not allowed to perform ${action}.`,
          control,
          overview: deps.buildOverview(options),
        };
      }

      const approvalActionResult = await deps.handleLegacyApprovalAction({
        action,
        payload,
        options,
        actor,
        governance,
        startedAt,
        deps: deps.getApprovalActionDeps(executeAction),
      });
      if (approvalActionResult) {
        return approvalActionResult;
      }

      const approvalRequestResult = deps.handleLegacyApprovalRequest({
        action,
        payload,
        options,
        actor,
        governance,
        startedAt,
        deps: deps.getApprovalRequestDeps((actionValue, payloadValue = {}, optionsValue = {}) =>
          requiresLegacyConsoleApproval(actionValue, payloadValue, optionsValue, deps)
        ),
      });
      if (approvalRequestResult) {
        return approvalRequestResult;
      }

      const result = await executeAction(action, payload, options);
      deps.recordTelemetry({
        type: action,
        status: result.ok ? "ok" : "error",
        durationMs: Date.now() - startedAt,
        actorId: actor.id,
        meta: { action },
      });
      return result;
    }

    const command = "command" in body ? String(body.command || "") : "";
    const startedAt = Date.now();
    const actor = deps.getActor(options);
    const governance = deps.loadCollaborationState().governance;
    const control = await deps.reviewConsoleRequest(body, actor, options);
    if (control.decision.decision === "blocked") {
      return {
        ok: false,
        error: control.decision.explanation,
        control,
        overview: deps.buildOverview(options),
      };
    }
    if (control.decision.decision === "simulate") {
      return {
        ok: true,
        output: control.decision.explanation,
        control,
        plan: control.plan,
        overview: deps.buildOverview(options),
      };
    }
    if (
      control.decision.decision === "confirm_required" &&
      !control.candidatePlan?.steps?.some((step) => step.unclassified)
    ) {
      return {
        ok: false,
        error: control.decision.explanation,
        control,
        plan: control.plan,
        requiresConfirmation: true,
        overview: deps.buildOverview(options),
      };
    }
    if (!deps.canExecuteCommands(actor.role, governance)) {
      deps.recordTelemetry({
        type: "command",
        status: "error",
        durationMs: Date.now() - startedAt,
        actorId: actor.id,
        meta: { reason: "forbidden", role: actor.role },
      });
      return {
        ok: false,
        error: `Role "${actor.role}" cannot execute console commands.`,
        control,
        overview: deps.buildOverview(options),
      };
    }
    const output = await executeCommand(command, options);
    deps.appendAuditEvent({
      type: "command",
      message: `Executed console command: ${command || "help"}.`,
      summary: command || "help",
      payload: { actorId: actor.id },
    });
    deps.recordTelemetry({
      type: "command",
      status: "ok",
      durationMs: Date.now() - startedAt,
      actorId: actor.id,
      meta: { command: command || "help" },
    });
    return { ok: true, output, control, overview: deps.buildOverview(options) };
  }

  return {
    executeCommand,
    executeAction,
    handleConsoleRequest,
  };
}

module.exports = {
  createLegacyConsoleRequestHandlers,
  isSensitiveLegacyConsoleAction,
  requiresLegacyConsoleApproval,
};
