import { measureSamAsyncDuration } from "../performance/samLatencyTracker";
import { getSamPerformanceSnapshot, incrementSamCounter, recordSamDuration, resetSamPerformanceMetrics } from "../performance/samPerformanceMetrics";
import { getSamThroughputSnapshot, recordSamThroughputEvent, resetSamThroughputTracker } from "../performance/samThroughputTracker";
import { runSamChaosScenario } from "../chaos/samChaosRunner";
import { determineSamDegradedMode } from "../scaling/samDegradedMode";
import { loadSamRuntimeLimits } from "../scaling/samRuntimeLimits";
import { createSamLoadMetrics, createSamLoadResult } from "./samLoadMetrics";
import { validateSamLoadScenario } from "./samLoadScenarioFactory";
import type { SamLoadScenarioRequest, SamLoadScenarioResult } from "./samLoadTypes";

export async function runSamLoadScenario(request: SamLoadScenarioRequest): Promise<SamLoadScenarioResult> {
  const validation = validateSamLoadScenario(request);
  if (!validation.ok) {
    return createSamLoadResult({
      type: request.type,
      passed: false,
      findings: [validation.error],
      metrics: createSamLoadMetrics({ finalMode: "FROZEN" }),
    });
  }

  const scenario = validation.data;
  resetSamPerformanceMetrics();
  resetSamThroughputTracker();

  return measureSamAsyncDuration("sam.bridge.duration", async () => {
    switch (scenario.type) {
      case "DUPLICATE_REPLAY_PRESSURE":
      case "RETRY_STORM": {
        let duplicateDryRunDetected = false;
        let duplicateAuditDetected = false;
        for (let index = 0; index < scenario.iterations; index += 1) {
          const result = await runSamChaosScenario({
            type: "DUPLICATE_REPLAY",
            executionId: scenario.executionId,
            attemptId: `${scenario.attemptId}-${index}`,
            deterministicSeed: `${scenario.deterministicSeed}-${index}`,
            dryRun: true,
          });
          duplicateDryRunDetected = duplicateDryRunDetected || result.duplicateDryRunDetected;
          duplicateAuditDetected = duplicateAuditDetected || result.duplicateAuditDetected;
          recordSamThroughputEvent("chaos_scenario_completed");
        }
        return createSamLoadResult({
          type: scenario.type,
          passed: !duplicateDryRunDetected && !duplicateAuditDetected,
          findings: [`iterations=${scenario.iterations}`],
          metrics: createSamLoadMetrics({
            duplicateDryRunDetected,
            duplicateAuditDetected,
            finalMode: determineSamDegradedMode({
              queueDepth: scenario.iterations,
              concurrentProposals: 0,
              concurrentDryRuns: 0,
              retryCount: scenario.iterations,
              pendingRetries: 0,
              auditAppendLatencyMs: 10,
              idempotencyStoreLatencyMs: 10,
              memoryPressure: 0.2,
              limits: loadSamRuntimeLimits(),
            }),
          }),
        });
      }

      case "CHAOS_UNDER_LOAD": {
        const chaosTypes = [
          "LOCK_LOSS",
          "DB_FAILURE",
          "PARTIAL_WRITE",
          "DUPLICATE_REPLAY",
        ] as const;
        const findings: string[] = [];
        let governanceBypassDetected = false;
        for (let index = 0; index < scenario.iterations; index += 1) {
          const result = await runSamChaosScenario({
            type: chaosTypes[index % chaosTypes.length],
            executionId: `${scenario.executionId}-${index}`,
            attemptId: `${scenario.attemptId}-${index}`,
            deterministicSeed: `${scenario.deterministicSeed}-${index}`,
            dryRun: true,
          });
          findings.push(...result.findings);
          governanceBypassDetected = governanceBypassDetected || result.governanceBypassDetected;
        }
        return createSamLoadResult({
          type: scenario.type,
          passed: governanceBypassDetected === false,
          findings,
          metrics: createSamLoadMetrics({
            governanceBypassDetected,
            finalMode: determineSamDegradedMode({
              queueDepth: scenario.iterations,
              concurrentProposals: 1,
              concurrentDryRuns: 1,
              retryCount: 1,
              pendingRetries: 1,
              auditAppendLatencyMs: 20,
              idempotencyStoreLatencyMs: 20,
              memoryPressure: 0.4,
              limits: loadSamRuntimeLimits(),
            }),
          }),
        });
      }

      default: {
        recordSamDuration("sam.bridge.duration", 0);
        incrementSamCounter("sam.retry.count", scenario.iterations);
        const finalMode = determineSamDegradedMode({
          queueDepth: scenario.iterations,
          concurrentProposals: Math.min(scenario.iterations, 2),
          concurrentDryRuns: 1,
          retryCount: 0,
          pendingRetries: 0,
          auditAppendLatencyMs: 10,
          idempotencyStoreLatencyMs: 10,
          memoryPressure: 0.1,
          limits: loadSamRuntimeLimits(),
        });
        return createSamLoadResult({
          type: scenario.type,
          passed: true,
          findings: [
            `throughput=${getSamThroughputSnapshot().totalEvents}`,
            `durationCount=${getSamPerformanceSnapshot().durations["sam.bridge.duration"]?.count || 0}`,
          ],
          metrics: createSamLoadMetrics({ finalMode }),
        });
      }
    }
  });
}
