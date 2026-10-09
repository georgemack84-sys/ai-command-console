function createLegacyJobProcessorBootstrap(deps) {
  let ready = false;

  return function ensureLegacyJobProcessorsRegistered() {
    if (ready) {
      return;
    }

    deps.initializeExecutionOrchestration({ bootstrap: "in_process_console" });

    const governedLegacyProcessor = {
      requiresAdmission: true,
      requiresReviewedExecution: true,
      admissionContract: deps.admissionContract,
    };

    deps.registerJobProcessor("watcher:run", async () => deps.evaluateRules(), governedLegacyProcessor);
    deps.registerJobProcessor("alerts:run", async () => deps.runAlertChecks(), governedLegacyProcessor);
    deps.registerJobProcessor("plugin:run", async (job) =>
      deps.runPlugin(String(job.payload?.name || ""), {
        input: `run plugin ${String(job.payload?.name || "")}`.trim(),
        pluginArg: String(job.payload?.pluginArg || ""),
      }),
      governedLegacyProcessor,
    );
    deps.registerJobProcessor("brief:route", async (job) => {
      const result = deps.queueBriefToTaskFor(String(job.payload?.workspace || "demo"), String(job.payload?.briefId || ""));
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result;
    }, governedLegacyProcessor);
    deps.registerJobProcessor(
      "report:create",
      async (job) => deps.createReportDraft(String(job.payload?.workspace || "demo"), job.payload || {}),
      governedLegacyProcessor,
    );
    deps.registerJobProcessor("report:publish", async (job) => {
      const result = deps.publishReportRecordFor(String(job.payload?.workspace || "demo"), String(job.payload?.reportId || ""));
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result;
    }, governedLegacyProcessor);
    deps.registerJobProcessor("digest:run-due", async (job) => {
      const workspace = String(job.payload?.workspace || "demo");
      try {
        return deps.runDueDigestsForWorkspace(workspace, deps.getLegacyDigestDeps());
      } catch (error) {
        deps.updateDigestWorkspaceState(workspace, {
          lastSweepRunAt: new Date().toISOString(),
          lastSweepError: error instanceof Error ? error.message : "Digest sweep failed.",
        });
        throw error;
      }
    }, governedLegacyProcessor);

    ready = true;
  };
}

module.exports = {
  createLegacyJobProcessorBootstrap,
};
