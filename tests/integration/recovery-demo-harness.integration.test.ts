import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const events: Array<Record<string, unknown>> = [];

const auditTrailPath = require.resolve("../../services/auditTrail.js");
const stateDatabasePath = require.resolve("../../services/stateDatabase.js");
const runtimePathsPath = require.resolve("../../services/runtimePaths.js");
const executionStateStorePath = require.resolve("../../services/executionStateStore.js");
const executionIntegrityStorePath = require.resolve("../../services/executionIntegrityStore.js");
const recoveryAuditStorePath = require.resolve("../../services/recoveryAuditStore.js");
const recoveryAdvisoryStorePath = require.resolve("../../services/recoveryAdvisoryStore.js");
const recoveryAutomationStorePath = require.resolve("../../services/recoveryAutomationStore.js");
const recoveryAutonomyStorePath = require.resolve("../../services/recoveryAutonomyStore.js");
const recoveryExecutionStorePath = require.resolve("../../services/recoveryExecutionStore.js");
const recoveryVerificationStorePath = require.resolve("../../services/recoveryVerificationStore.js");
const recoveryLearningStorePath = require.resolve("../../services/recoveryLearningStore.js");

function clearModule(modulePath: string) {
  delete require.cache[modulePath];
}

async function loadRuntime() {
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
  vi.resetModules();
  for (const modulePath of [
    stateDatabasePath,
    runtimePathsPath,
    executionStateStorePath,
    executionIntegrityStorePath,
    recoveryAuditStorePath,
    recoveryAdvisoryStorePath,
    recoveryAutomationStorePath,
    recoveryAutonomyStorePath,
    recoveryExecutionStorePath,
    recoveryVerificationStorePath,
    recoveryLearningStorePath,
  ]) {
    clearModule(modulePath);
  }

  require.cache[auditTrailPath] = {
    id: auditTrailPath,
    filename: auditTrailPath,
    loaded: true,
    exports: {
      appendAuditEvent: (event: Record<string, unknown>) => {
        const entry = {
          id: `audit_${events.length + 1}`,
          timestamp: new Date(1700000000000 + events.length * 1000).toISOString(),
          ...event,
        };
        events.push(entry);
        return entry;
      },
      listAuditEvents: (limit = 5000) => [...events].slice(-Math.max(1, Number(limit || 5000))).reverse(),
      clearAuditEvents: () => {
        events.splice(0, events.length);
      },
    },
  } as any;

  const stateDatabase = require("../../services/stateDatabase.js");
  const executionStateStore = require("../../services/executionStateStore.js");
  executionStateStore.clearExecutionStateForTests();

  const runnerModule = await import("../../services/recovery/recoveryDemoScenarioRunner.ts");
  const runRecoveryDemoScenario =
    (runnerModule as any).runRecoveryDemoScenario
    || (runnerModule as any).default?.runRecoveryDemoScenario
    || (runnerModule as any)["module.exports"]?.runRecoveryDemoScenario;

  return {
    stateDatabase,
    executionStateStore,
    runRecoveryDemoScenario,
  };
}

beforeEach(() => {
  events.splice(0, events.length);
  process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
});

describe("recovery demo harness integration", () => {
  it("normal recovery scenario runs end-to-end", async () => {
    const runtime = await loadRuntime();
    const scenario = (await import("../../scripts/demo/scenarios/recovery-normal.json")).default;
    try {
      const result = await runtime.runRecoveryDemoScenario({ scenario, validateDashboard: true });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.ok).toBe(true);
      expect(result.data.readModelSummary.recoveryStatus).toBe("completed");
      expect(result.data.evidenceSummary.state).toBe("normal");
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("disputed timeline scenario runs end-to-end", async () => {
    const runtime = await loadRuntime();
    const scenario = (await import("../../scripts/demo/scenarios/recovery-disputed.json")).default;
    try {
      const result = await runtime.runRecoveryDemoScenario({ scenario, validateDashboard: true });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.evidenceSummary.state).toBe("disputed");
      expect(result.data.dashboardSummary?.mutatingActionsFrozen).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("stale lock scenario runs end-to-end", async () => {
    const runtime = await loadRuntime();
    const scenario = (await import("../../scripts/demo/scenarios/stale-lock.json")).default;
    try {
      const result = await runtime.runRecoveryDemoScenario({ scenario });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.readModelSummary.operatorAttention).toBe(true);
      expect(result.data.evidenceSummary.warnings.length).toBeGreaterThan(0);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("open advisory scenario runs end-to-end", async () => {
    const runtime = await loadRuntime();
    const scenario = (await import("../../scripts/demo/scenarios/advisory-open.json")).default;
    try {
      const result = await runtime.runRecoveryDemoScenario({ scenario });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.readModelSummary.advisoryStatus).toBe("open");
      expect(result.data.operatorSummary.allowed).toEqual(expect.arrayContaining(["DISMISS_ADVISORY", "ESCALATE_ADVISORY"]));
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("verification failed scenario runs end-to-end", async () => {
    const runtime = await loadRuntime();
    const scenario = (await import("../../scripts/demo/scenarios/verification-failed.json")).default;
    try {
      const result = await runtime.runRecoveryDemoScenario({ scenario });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.readModelSummary.verificationStatus).toBe("failed");
      expect(result.data.readModelSummary.operatorAttention).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("evidence export scenario runs end-to-end", async () => {
    const runtime = await loadRuntime();
    const scenario = (await import("../../scripts/demo/scenarios/evidence-export.json")).default;
    try {
      const result = await runtime.runRecoveryDemoScenario({ scenario, exportEvidence: true });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.evidenceSummary.hash).toBeTruthy();
      expect(result.data.ok).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("dashboard-normal scenario validates API/dashboard-ready output", async () => {
    const runtime = await loadRuntime();
    const scenario = (await import("../../scripts/demo/scenarios/dashboard-normal.json")).default;
    try {
      const result = await runtime.runRecoveryDemoScenario({ scenario, validateDashboard: true });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.dashboardSummary?.systemState).toBe("normal");
      expect(result.data.dashboardSummary?.exportVisible).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("dashboard-disputed scenario validates frozen actions + export visibility", async () => {
    const runtime = await loadRuntime();
    const scenario = (await import("../../scripts/demo/scenarios/dashboard-disputed.json")).default;
    try {
      const result = await runtime.runRecoveryDemoScenario({ scenario, validateDashboard: true });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.dashboardSummary?.systemState).toBe("disputed");
      expect(result.data.dashboardSummary?.mutatingActionsFrozen).toBe(true);
      expect(result.data.dashboardSummary?.exportVisible).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("all scenarios remain isolated", async () => {
    const runtime = await loadRuntime();
    const normal = (await import("../../scripts/demo/scenarios/recovery-normal.json")).default;
    const disputed = (await import("../../scripts/demo/scenarios/recovery-disputed.json")).default;
    try {
      const first = await runtime.runRecoveryDemoScenario({ scenario: normal });
      const second = await runtime.runRecoveryDemoScenario({ scenario: disputed });
      expect(first.ok && second.ok && first.data.executionId).not.toBe(second.ok ? second.data.executionId : "");
      expect(runtime.executionStateStore.getResumableExecutions().every((entry: any) => String(entry.id).startsWith("demo-"))).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("demo harness does not mutate non-demo state", async () => {
    const runtime = await loadRuntime();
    const scenario = (await import("../../scripts/demo/scenarios/recovery-normal.json")).default;
    try {
      const before = runtime.executionStateStore.getResumableExecutions();
      await runtime.runRecoveryDemoScenario({ scenario });
      const after = runtime.executionStateStore.getResumableExecutions();
      expect(after.every((entry: any) => String(entry.id).startsWith("demo-"))).toBe(true);
      expect(before.every((entry: any) => String(entry.id).startsWith("demo-"))).toBe(true);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });

  it("dry run performs no writes", async () => {
    const runtime = await loadRuntime();
    const scenario = (await import("../../scripts/demo/scenarios/recovery-normal.json")).default;
    try {
      const before = runtime.executionStateStore.getResumableExecutions().length;
      const result = await runtime.runRecoveryDemoScenario({ scenario, dryRun: true });
      const after = runtime.executionStateStore.getResumableExecutions().length;
      expect(result.ok).toBe(true);
      expect(after).toBe(before);
      expect(events.length).toBe(0);
    } finally {
      runtime.stateDatabase.closeDatabase();
    }
  });
});
