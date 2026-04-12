function createWorkflowTask(payload, deps) {
  const task = deps.addTask(String(payload.agentName || ""), String(payload.description || ""), {
    priority: Number(payload.priority || 3),
    sourceAgent: "manager",
    delegationReason: "Created from the browser console workflow.",
    tags: ["browser-workflow"],
    notifyAgent: "manager",
    callbackEnabled: true,
  });

  return {
    ok: true,
    output: deps.formatTasks([task]),
    audit: {
      message: `Created task ${task.id} for ${task.agentName}.`,
      summary: task.description,
      payload: { taskId: task.id, agentName: task.agentName },
    },
  };
}

function routeWorkflowTask(payload, deps) {
  const result = deps.routeManagerTask(String(payload.description || ""));
  return {
    ok: true,
    output: [`Routed to ${result.routing.agentName}.`, `Reason: ${result.routing.delegationReason}`, deps.formatTasks([result.task])].join("\n\n"),
    audit: {
      message: `Routed task ${result.task.id} to ${result.routing.agentName}.`,
      summary: String(payload.description || ""),
      payload: { taskId: result.task.id, agentName: result.routing.agentName },
    },
  };
}

function runReviewAction(action, payload, deps) {
  if (action === "review:approve") {
    const result = deps.approveReviewItem(String(payload.taskId || ""));
    return {
      ok: result.ok,
      output: result.message,
      audit: {
        message: result.message,
        payload,
      },
    };
  }

  if (action === "review:create") {
    const result = deps.addReviewItemForTask(String(payload.taskId || ""));
    return {
      ok: result.ok,
      output: result.message,
      audit: {
        message: result.message,
        payload,
      },
    };
  }

  if (action === "review:revise") {
    const result = deps.reviseReviewItem(String(payload.taskId || ""), String(payload.note || ""));
    return {
      ok: result.ok,
      output: result.message,
      audit: {
        message: result.message,
        summary: String(payload.note || ""),
        payload,
      },
    };
  }

  if (action === "review:followup") {
    const result = deps.createFollowupTask(String(payload.taskId || ""), String(payload.agentName || ""), String(payload.description || ""));
    return {
      ok: result.ok,
      output: result.message,
      audit: {
        message: result.message,
        summary: String(payload.description || ""),
        payload,
      },
    };
  }

  return null;
}

function runAlertAction(action, payload, deps) {
  if (action === "alert:acknowledge") {
    const result = deps.acknowledgeAlert(String(payload.alertId || ""), String(payload.owner || "manager"));
    return {
      ok: result.ok,
      output: result.message,
      audit: {
        message: result.message,
        payload,
      },
    };
  }

  if (action === "alert:resolve") {
    const result = deps.resolveAlert(String(payload.alertId || ""), String(payload.note || ""));
    return {
      ok: result.ok,
      output: result.message,
      audit: {
        message: result.message,
        summary: String(payload.note || ""),
        payload,
      },
    };
  }

  if (action === "alert:note") {
    const result = deps.addAlertNote(String(payload.alertId || ""), String(payload.note || ""));
    return {
      ok: result.ok,
      output: result.message,
      audit: {
        message: result.message,
        summary: String(payload.note || ""),
        payload,
      },
    };
  }

  if (action === "alert:run-checks") {
    const result = deps.runAlertChecks();
    return {
      ok: true,
      output: "Alert checks completed.",
      result,
      audit: {
        message: "Ran operational alert checks from the dashboard.",
        payload: {},
      },
    };
  }

  return null;
}

module.exports = {
  createWorkflowTask,
  routeWorkflowTask,
  runReviewAction,
  runAlertAction,
};
