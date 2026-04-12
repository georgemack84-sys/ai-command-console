function runJobAction(action, payload, workspace, actor, deps) {
  if (action === "plugin:run") {
    const pluginName = String(payload.name || "");
    const pluginArg = String(payload.pluginArg || "");
    const job = deps.enqueueJob("plugin:run", { name: pluginName, pluginArg }, actor);
    return {
      ok: true,
      output: `Queued plugin ${pluginName} as ${job.id}.`,
      audit: {
        message: `Queued plugin ${pluginName} as ${job.id}.`,
        summary: pluginArg || null,
        payload: { ...payload, jobId: job.id },
      },
    };
  }

  if (action === "job:cancel") {
    const job = deps.cancelJob(String(payload.jobId || ""));
    if (!job || job.status !== "canceled") {
      return { ok: false, error: `Unable to cancel job ${payload.jobId}.` };
    }
    return {
      ok: true,
      output: `Canceled job ${job.id}.`,
      audit: {
        message: `Canceled job ${job.id}.`,
        payload: { jobId: job.id },
      },
    };
  }

  if (action === "job:retry") {
    const job = deps.retryJob(String(payload.jobId || ""));
    if (!job || job.status !== "queued") {
      return { ok: false, error: `Unable to retry job ${payload.jobId}.` };
    }
    return {
      ok: true,
      output: `Retried job ${job.id}.`,
      audit: {
        message: `Retried job ${job.id}.`,
        payload: { jobId: job.id },
      },
    };
  }

  if (action === "job:detail") {
    const job = deps.getJob(String(payload.jobId || ""), { full: true });
    if (!job) {
      return { ok: false, error: `Job not found: ${payload.jobId}.` };
    }
    return {
      ok: true,
      output: `Loaded job ${job.id}.`,
      detail: { job },
    };
  }

  if (action === "brief:route") {
    const briefId = String(payload.briefId || "");
    const job = deps.enqueueJob("brief:route", { workspace, briefId }, actor);
    return {
      ok: true,
      output: `Queued brief routing as ${job.id}.`,
      audit: {
        message: `Queued research brief job ${job.id}.`,
        payload: { briefId, jobId: job.id },
      },
    };
  }

  if (action === "report:create") {
    const job = deps.enqueueJob("report:create", { workspace, ...payload }, actor);
    return {
      ok: true,
      output: `Queued report draft creation as ${job.id}.`,
      audit: {
        message: `Queued research report creation as ${job.id}.`,
        summary: String(payload.title || ""),
        payload: { briefId: payload.briefId, jobId: job.id },
      },
    };
  }

  if (action === "report:publish") {
    const reportId = String(payload.reportId || "");
    const job = deps.enqueueJob("report:publish", { workspace, reportId }, actor);
    return {
      ok: true,
      output: `Queued report publish as ${job.id}.`,
      audit: {
        message: `Queued report publish as ${job.id}.`,
        payload: { reportId, jobId: job.id },
      },
    };
  }

  return null;
}

function runWatcherAction(action, payload, deps) {
  if (action === "watcher:start") {
    const state = deps.startWatcher(Number(payload.intervalSeconds || 5));
    return {
      ok: true,
      output: `Watcher started at ${state.intervalSeconds}s interval.`,
      audit: {
        message: `Started watcher at ${state.intervalSeconds}s.`,
        payload: { intervalSeconds: state.intervalSeconds },
      },
    };
  }

  if (action === "watcher:stop") {
    const reason = String(payload.reason || "stopped_by_user");
    deps.stopWatcher(reason);
    return {
      ok: true,
      output: "Watcher stopped.",
      audit: {
        message: "Stopped watcher.",
        payload: { reason },
      },
    };
  }

  if (action === "watcher:rule-upsert") {
    const ruleName = String(payload.name || "");
    const existing = deps.getWatcherStatus().rules.find((rule) => rule.name === ruleName);
    const rule = existing ? deps.updateWatcherRule(ruleName, payload) : deps.addWatcherRule(payload);
    return {
      ok: true,
      output: `Saved watcher rule ${rule.name}.`,
      audit: {
        message: `Saved watcher rule ${rule.name}.`,
        payload: rule,
      },
    };
  }

  if (action === "watcher:rule-delete") {
    const removed = deps.removeWatcherRule(String(payload.name || ""));
    const ruleName = String(payload.name || "");
    return {
      ok: removed,
      output: removed ? `Removed watcher rule ${ruleName}.` : `Watcher rule not found: ${ruleName}.`,
      audit: {
        message: removed ? `Removed watcher rule ${ruleName}.` : `Watcher rule not found: ${ruleName}.`,
        payload,
      },
    };
  }

  return null;
}

module.exports = {
  runJobAction,
  runWatcherAction,
};
