type RuntimePosture = {
  environment: string;
  jobs?: {
    executionMode?: "in_process" | "external";
    maxPendingJobs?: number;
    maxRunningJobs?: number;
    externalWorkerRecommended?: boolean;
  };
  process?: {
    memory?: {
      rssMb?: number;
      heapUsedMb?: number;
      heapTotalMb?: number;
    };
  };
};

type QueueHealth = {
  running?: number;
  activeWorkers?: number;
  queued?: number;
  scheduledRetries?: number;
  staleRunning?: number;
  unhealthy?: boolean;
  pending?: number;
  saturated?: boolean;
  maxPendingJobs?: number;
  maxRunningJobs?: number;
};

export type RuntimeWarning = {
  code: string;
  severity: "warning" | "critical";
  message: string;
};

export function buildRuntimeWarnings(runtime: RuntimePosture, queueHealth?: QueueHealth | null) {
  const warnings: RuntimeWarning[] = [];
  const jobs = runtime.jobs;
  const memory = runtime.process?.memory;

  if (jobs?.externalWorkerRecommended) {
    warnings.push({
      code: "jobs_external_worker_recommended",
      severity: "warning",
      message: "Background jobs are running in-process. Use an external worker for sustained load.",
    });
  }

  if (
    jobs?.executionMode === "external" &&
    Number(queueHealth?.pending || 0) > 0 &&
    Number(queueHealth?.activeWorkers || 0) === 0
  ) {
    warnings.push({
      code: "jobs_external_worker_missing",
      severity: "critical",
      message: "Background jobs are queued but no external worker is currently active.",
    });
  }

  if (queueHealth?.saturated || queueHealth?.unhealthy || Number(queueHealth?.staleRunning || 0) > 0) {
    warnings.push({
      code: "jobs_queue_degraded",
      severity: "critical",
      message: "The jobs queue is saturated or degraded and needs operator attention.",
    });
  } else if (queueHealth) {
    const pending = Number(queueHealth.pending ?? ((queueHealth.queued || 0) + (queueHealth.scheduledRetries || 0)));
    const running = Number(queueHealth.running || 0);
    const pendingLimit = Math.max(1, Number(queueHealth.maxPendingJobs || jobs?.maxPendingJobs || 1));
    const runningLimit = Math.max(1, Number(queueHealth.maxRunningJobs || jobs?.maxRunningJobs || 1));
    const pendingPressure = pending / pendingLimit;
    const runningPressure = running / runningLimit;

    if (pendingPressure >= 0.7 || runningPressure >= 0.7) {
      warnings.push({
        code: "jobs_queue_pressure",
        severity: "warning",
        message: "The jobs queue is running hot and nearing its configured capacity limits.",
      });
    }
  }

  if (memory) {
    const isDevelopment = runtime.environment === "development";
    const warningRssMb = isDevelopment ? 1400 : 1024;
    const criticalRssMb = isDevelopment ? 1800 : 1536;
    const warningHeapPressure = isDevelopment ? 0.9 : 0.8;
    const criticalHeapPressure = isDevelopment ? 0.96 : 0.92;
    const rssMb = Number(memory.rssMb || 0);
    const heapUsedMb = Number(memory.heapUsedMb || 0);
    const heapTotalMb = Math.max(1, Number(memory.heapTotalMb || 1));
    const heapPressure = heapUsedMb / heapTotalMb;

    if (rssMb >= criticalRssMb || heapPressure >= criticalHeapPressure) {
      warnings.push({
        code: "process_memory_critical",
        severity: "critical",
        message: "Process memory usage is critically high and could destabilize the app.",
      });
    } else if (rssMb >= warningRssMb || heapPressure >= warningHeapPressure) {
      warnings.push({
        code: "process_memory_pressure",
        severity: "warning",
        message: "Process memory usage is elevated and should be watched under load.",
      });
    }
  }

  return warnings;
}
