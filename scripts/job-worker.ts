import "dotenv/config";
import { ensureBackgroundJobProcessors } from "@/src/server/jobs/background-jobs";
import { logger } from "@/src/server/observability/logger";
import { assertRuntimeStartupAllowed } from "@/services/startup/startupGovernor";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { configureJobQueue, runJobWorkerCycle } = require("../services/jobQueue");
const { initializeExecutionOrchestration } = require("../services/stepController");

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  await assertRuntimeStartupAllowed(process.env);
  const { env, getJobWorkerPollIntervalMs } = await import("@/src/config/env");
  initializeExecutionOrchestration({ bootstrap: "external_worker" });
  configureJobQueue({
    executionMode: "external",
    workerPollIntervalMs: getJobWorkerPollIntervalMs(),
  });
  ensureBackgroundJobProcessors();

  logger.info("Starting external job worker.", {
    executionMode: env.JOB_QUEUE_EXECUTION_MODE,
    pollIntervalMs: getJobWorkerPollIntervalMs(),
  });

  let running = true;
  const stop = () => {
    running = false;
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  while (running) {
    try {
      await runJobWorkerCycle();
    } catch (error) {
      logger.error("External job worker cycle failed.", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await delay(getJobWorkerPollIntervalMs());
  }

  logger.info("External job worker stopped.");
}

void main().catch((error) => {
  logger.error("External job worker crashed during startup.", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
