import fs from "node:fs";
import path from "node:path";

import { closeDatabase } from "../../services/stateDatabase.js";
import {
  DEMO_EXPORT_DIR,
  DEMO_SCENARIO_WARNINGS,
  SUPPORTED_SCENARIOS,
} from "../../constants/recoveryDemoScenario.constants";
import type { RecoveryDemoScenario } from "../../types/recoveryDemoScenario";
import { runRecoveryDemoScenario } from "../../services/recovery/recoveryDemoScenarioRunner";

type CliOptions = {
  scenario?: string;
  all: boolean;
  dryRun: boolean;
  validateDashboard: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    all: false,
    dryRun: false,
    validateDashboard: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--scenario") {
      options.scenario = argv[index + 1];
      index += 1;
    } else if (current === "--all") {
      options.all = true;
    } else if (current === "--dry-run") {
      options.dryRun = true;
    } else if (current === "--validate-dashboard") {
      options.validateDashboard = true;
    }
  }

  return options;
}

function loadScenario(scenarioId: string): RecoveryDemoScenario {
  const filePath = path.join(process.cwd(), "scripts", "demo", "scenarios", `${scenarioId}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDemoEnvironment() {
  if (!process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH) {
    process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = path.join(
      process.cwd(),
      ".codex-temp",
      "recovery-demo",
      "agents",
      "console.sqlite",
    );
  }
}

function printReport(report: Awaited<ReturnType<typeof runRecoveryDemoScenario>>, options: CliOptions) {
  if (!report.ok) {
    console.log(`Scenario failed closed: ${report.error}`);
    if (report.warnings?.length) {
      console.log(`Warnings: ${report.warnings.join(", ")}`);
    }
    return false;
  }

  const exportDir = path.join(process.cwd(), DEMO_EXPORT_DIR);
  console.log(`Scenario: ${report.data.scenarioId}`);
  console.log(`Execution ID: ${report.data.executionId}`);
  console.log(`Recovery: ${report.data.readModelSummary.recoveryStatus || "-"}`);
  console.log(`Verification: ${report.data.readModelSummary.verificationStatus || "-"}`);
  console.log(`Advisory: ${report.data.readModelSummary.advisoryStatus || "-"}`);
  console.log(`Timeline matches: ${String(report.data.timelineSummary.matchesReadModel)}`);
  console.log(`Evidence state: ${report.data.evidenceSummary.state}`);
  console.log(`Allowed actions: ${report.data.operatorSummary.allowed.join(", ") || "-"}`);
  console.log(
    `Blocked actions: ${
      report.data.operatorSummary.blocked.map((entry) => `${entry.action}${entry.reason ? ` (${entry.reason})` : ""}`).join(", ") || "-"
    }`,
  );
  if (report.data.dashboardSummary) {
    console.log(`Dashboard state: ${report.data.dashboardSummary.systemState}`);
  }
  if (report.data.evidenceSummary.warnings.length) {
    console.log(`Warnings: ${report.data.evidenceSummary.warnings.join(", ")}`);
  }
  const jsonPath = path.join(exportDir, `${report.data.scenarioId}.json`);
  const markdownPath = path.join(exportDir, `${report.data.scenarioId}.md`);
  if (!options.dryRun && (fs.existsSync(jsonPath) || fs.existsSync(markdownPath))) {
    console.log(`Export paths: ${[jsonPath, markdownPath].filter((entry) => fs.existsSync(entry)).join(", ")}`);
  }
  console.log(`Result: ${report.data.ok ? "PASS" : "FAIL"}`);
  console.log("");
  return report.data.ok;
}

async function main() {
  ensureDemoEnvironment();
  const options = parseArgs(process.argv.slice(2));
  const scenarioIds = options.all
    ? [...SUPPORTED_SCENARIOS]
    : options.scenario
      ? [options.scenario]
      : [];

  if (scenarioIds.length === 0) {
    console.error("Provide --scenario <name> or --all.");
    process.exitCode = 1;
    return;
  }

  let allPassed = true;
  for (const scenarioId of scenarioIds) {
    const scenario = loadScenario(scenarioId);
    const report = await runRecoveryDemoScenario({
      scenario,
      dryRun: options.dryRun,
      exportEvidence: !options.dryRun,
      validateDashboard: options.validateDashboard,
    });
    const passed = printReport(report, options);
    if (!passed) {
      allPassed = false;
    }
    if (report.ok && report.data.evidenceSummary.warnings.includes(DEMO_SCENARIO_WARNINGS.ASSERTION_FAILED)) {
      allPassed = false;
    }
  }

  closeDatabase();
  process.exitCode = allPassed ? 0 : 1;
}

void main();
