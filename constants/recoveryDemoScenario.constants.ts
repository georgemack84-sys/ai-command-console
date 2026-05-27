export const DEMO_EXECUTION_PREFIX = "demo-";

export const DEMO_SCENARIO_ERRORS = {
  BLOCKED_UNSAFE_DEMO_SCENARIO: "BLOCKED_UNSAFE_DEMO_SCENARIO",
} as const;

export const DEMO_SCENARIO_WARNINGS = {
  INVALID_DEMO_EXECUTION_ID: "INVALID_DEMO_EXECUTION_ID",
  DRY_RUN_NO_SEED: "DRY_RUN_NO_SEED",
  ASSERTION_FAILED: "ASSERTION_FAILED",
  PARTIAL_DEMO_OUTPUT: "PARTIAL_DEMO_OUTPUT",
  DASHBOARD_VALIDATION_FAILED: "DASHBOARD_VALIDATION_FAILED",
} as const;

export const SUPPORTED_SCENARIOS = [
  "recovery-normal",
  "recovery-disputed",
  "stale-lock",
  "advisory-open",
  "verification-failed",
  "evidence-export",
  "dashboard-normal",
  "dashboard-disputed",
] as const;

export const DEMO_EXPORT_VERSION = "3.5F-1";
export const DEMO_EXPORT_DIR = ".codex-temp/recovery-demo/exports";
export const DEMO_NOW_MS = 1700000000000;
