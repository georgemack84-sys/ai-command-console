import { describe, expect, it } from "vitest";
import { buildRuntimeWarnings } from "@/src/server/health/runtime-warnings";

describe("runtime warnings", () => {
  it("warns when external workers are recommended", () => {
    const warnings = buildRuntimeWarnings({
      environment: "development",
      jobs: {
        executionMode: "in_process",
        maxPendingJobs: 100,
        maxRunningJobs: 12,
        externalWorkerRecommended: true,
      },
      process: {
        memory: {
          rssMb: 500,
          heapUsedMb: 40,
          heapTotalMb: 100,
        },
      },
    });

    expect(warnings.some((warning) => warning.code === "jobs_external_worker_recommended")).toBe(true);
  });

  it("marks queue degradation as critical", () => {
    const warnings = buildRuntimeWarnings(
      {
        environment: "production",
        jobs: {
          executionMode: "external",
          maxPendingJobs: 100,
          maxRunningJobs: 12,
          externalWorkerRecommended: false,
        },
        process: {
          memory: {
            rssMb: 500,
            heapUsedMb: 40,
            heapTotalMb: 100,
          },
        },
      },
      {
        running: 3,
        queued: 90,
        scheduledRetries: 15,
        staleRunning: 1,
        unhealthy: true,
        pending: 105,
        saturated: true,
        maxPendingJobs: 100,
        maxRunningJobs: 12,
      },
    );

    expect(warnings.some((warning) => warning.code === "jobs_queue_degraded" && warning.severity === "critical")).toBe(true);
  });

  it("warns when queue pressure is elevated before saturation", () => {
    const warnings = buildRuntimeWarnings(
      {
        environment: "production",
        jobs: {
          executionMode: "external",
          maxPendingJobs: 100,
          maxRunningJobs: 12,
          externalWorkerRecommended: false,
        },
        process: {
          memory: {
            rssMb: 500,
            heapUsedMb: 40,
            heapTotalMb: 100,
          },
        },
      },
      {
        running: 8,
        queued: 65,
        scheduledRetries: 10,
        staleRunning: 0,
        unhealthy: false,
        pending: 75,
        saturated: false,
        maxPendingJobs: 100,
        maxRunningJobs: 12,
      },
    );

    expect(warnings.some((warning) => warning.code === "jobs_queue_pressure" && warning.severity === "warning")).toBe(true);
  });

  it("marks missing external workers as critical when jobs are pending", () => {
    const warnings = buildRuntimeWarnings(
      {
        environment: "production",
        jobs: {
          executionMode: "external",
          maxPendingJobs: 100,
          maxRunningJobs: 12,
          externalWorkerRecommended: false,
        },
        process: {
          memory: {
            rssMb: 500,
            heapUsedMb: 40,
            heapTotalMb: 100,
          },
        },
      },
      {
        running: 0,
        queued: 5,
        scheduledRetries: 3,
        staleRunning: 0,
        unhealthy: false,
        pending: 8,
        activeWorkers: 0,
        saturated: false,
        maxPendingJobs: 100,
        maxRunningJobs: 12,
      },
    );

    expect(warnings.some((warning) => warning.code === "jobs_external_worker_missing" && warning.severity === "critical")).toBe(true);
  });

  it("uses looser development memory thresholds", () => {
    const warnings = buildRuntimeWarnings({
      environment: "development",
      jobs: {
        executionMode: "external",
        maxPendingJobs: 100,
        maxRunningJobs: 12,
        externalWorkerRecommended: false,
      },
      process: {
        memory: {
          rssMb: 1200,
          heapUsedMb: 80,
          heapTotalMb: 100,
        },
      },
    });

    expect(warnings.some((warning) => warning.code === "process_memory_pressure")).toBe(false);
  });
});
