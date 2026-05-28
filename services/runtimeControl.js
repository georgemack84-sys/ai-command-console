const fs = require("fs");
const path = require("path");
const { loadJsonDocument } = require("./documentStore");
const { createPlan } = require("./planner");
const { appendAuditEvent } = require("./auditTrail");
const {
  loadReviewSurfaceState,
} = require("./reviewSurface");
const {
  loadLearningState,
  buildLearningAdvisory,
  buildGovernedLearningLayer: computeGovernedLearningLayer,
  applyLearningToAdaptiveReview: applyGovernedLearningToAdaptiveReview,
  recordLearningEvent: persistLearningEvent,
  resetLearningState: resetPersistedLearningState,
  setLearningMode: persistLearningMode,
} = require("./learningAdvisory");

const CONTROL_POLICY_PATH = path.join(__dirname, "..", "config", "control-policy.json");
const MODE_ORDER = {
  blocked: 0,
  simulate: 1,
  confirm_required: 2,
  auto_execute: 3,
};
const EXECUTABLE_REVIEW_STATUSES = new Set(["approved", "downgraded", "rewritten", "split"]);
const ALL_REVIEW_STATUSES = new Set([...EXECUTABLE_REVIEW_STATUSES, "blocked", "pending"]);
const DISCOVERY_RESULT_VALUES = new Set(["FOUND", "PARTIAL", "UNKNOWN"]);
const REVIEW_SURFACE_VALUES = new Set(["ui", "cli", "api", "unknown"]);
const OVERRIDE_ACKNOWLEDGMENTS = new Set(["PLANNER_UNAVAILABLE", "SYNTHETIC_PLAN", "BLOCKED_STATE"]);
const VALID_PLAN_QUALITIES = new Set(["planner_validated", "structured_native", "synthetic"]);
const VALID_PLAN_COMPLETENESS = new Set(["full", "partial"]);

function createDefaultPolicy() {
  return {
    version: 1,
    defaultExecutionMode: "blocked",
    lowRiskAutoExecuteThreshold: 30,
    identityRoleMap: {
      human: "operator",
      agent: "agent",
      automation: "automation",
      system: "system",
    },
    roleAliases: {
      viewer: "observer",
      approver: "operator",
    },
    roleModeCeilings: {
      observer: "simulate",
      agent: "confirm_required",
      automation: "confirm_required",
      operator: "auto_execute",
      admin: "auto_execute",
      system: "auto_execute",
    },
    categoryActionClassMap: {
      shell_read: "read",
      file_read: "read",
      shell_mutation: "execute",
      file_write: "mutate",
      process_control: "process",
      agent_control: "process",
      workflow_control: "process",
      network_mutation: "network",
      credential_access: "network",
      plugin_action: "plugin",
    },
    saferToolMap: {},
    categoryPolicies: {},
    actionCategoryMap: {},
    actionPrefixCategoryMap: {},
    commandCategoryMap: {},
    commandPrefixCategoryMap: {},
    strictMode: {
      systemTimeoutSeconds: null,
      maxModifyCyclesPerStep: 2,
      primaryReviewSurface: "api",
      secondaryReviewSurfaces: ["ui", "cli"],
      concurrencyResponsibility: "execution_engine",
      reviewIntelligenceLookbackLimit: 50,
      reviewIntelligenceLookbackDays: 7,
    },
  };
}

function normalizeStrictModeConfig(strictMode = {}) {
  const primaryReviewSurface = REVIEW_SURFACE_VALUES.has(String(strictMode.primaryReviewSurface || "").trim())
    ? String(strictMode.primaryReviewSurface).trim()
    : "api";
  const secondaryReviewSurfaces = Array.isArray(strictMode.secondaryReviewSurfaces)
    ? [...new Set(
      strictMode.secondaryReviewSurfaces
        .map((surface) => String(surface || "").trim())
        .filter((surface) => REVIEW_SURFACE_VALUES.has(surface) && surface !== primaryReviewSurface)
    )]
    : ["ui", "cli"];

  return {
    systemTimeoutSeconds:
      strictMode.systemTimeoutSeconds == null ? null : Number(strictMode.systemTimeoutSeconds),
    maxModifyCyclesPerStep: Math.max(0, Number(strictMode.maxModifyCyclesPerStep ?? 2) || 0),
    primaryReviewSurface,
    secondaryReviewSurfaces,
    concurrencyResponsibility:
      String(strictMode.concurrencyResponsibility || "execution_engine"),
    reviewIntelligenceLookbackLimit: Math.max(
      1,
      Number(strictMode.reviewIntelligenceLookbackLimit ?? 50) || 50
    ),
    reviewIntelligenceLookbackDays: Math.max(
      1,
      Number(strictMode.reviewIntelligenceLookbackDays ?? 7) || 7
    ),
  };
}

function mergePolicyWithDefaults(loadedPolicy = {}) {
  const normalizedLoadedPolicy = { ...(loadedPolicy || {}) };
  if (
    Number(normalizedLoadedPolicy.version || 1) < 2 &&
    normalizedLoadedPolicy.actionCategoryMap?.list_plugins === "plugin_action"
  ) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      list_plugins: "shell_read",
    };
    normalizedLoadedPolicy.version = 2;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 3) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      dashboard_system:
        normalizedLoadedPolicy.actionCategoryMap?.dashboard_system || "shell_read",
      dashboard_health:
        normalizedLoadedPolicy.actionCategoryMap?.dashboard_health || "shell_read",
      dashboard_workload:
        normalizedLoadedPolicy.actionCategoryMap?.dashboard_workload || "shell_read",
      queue_list: normalizedLoadedPolicy.actionCategoryMap?.queue_list || "shell_read",
      queue_next: normalizedLoadedPolicy.actionCategoryMap?.queue_next || "shell_read",
      alerts_list: normalizedLoadedPolicy.actionCategoryMap?.alerts_list || "shell_read",
      alerts_active: normalizedLoadedPolicy.actionCategoryMap?.alerts_active || "shell_read",
    };
    normalizedLoadedPolicy.version = 3;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 4) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      agents_list: normalizedLoadedPolicy.actionCategoryMap?.agents_list || "shell_read",
      agent_status: normalizedLoadedPolicy.actionCategoryMap?.agent_status || "shell_read",
      schedule_list: normalizedLoadedPolicy.actionCategoryMap?.schedule_list || "shell_read",
      schedule_status: normalizedLoadedPolicy.actionCategoryMap?.schedule_status || "shell_read",
      watcher_status: normalizedLoadedPolicy.actionCategoryMap?.watcher_status || "shell_read",
    };
    normalizedLoadedPolicy.version = 4;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 5) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      schedule_run: normalizedLoadedPolicy.actionCategoryMap?.schedule_run || "process_control",
      watcher_run: normalizedLoadedPolicy.actionCategoryMap?.watcher_run || "process_control",
      alerts_run: normalizedLoadedPolicy.actionCategoryMap?.alerts_run || "process_control",
    };
    normalizedLoadedPolicy.version = 5;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 6) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      agent_start: normalizedLoadedPolicy.actionCategoryMap?.agent_start || "process_control",
      agent_tick: normalizedLoadedPolicy.actionCategoryMap?.agent_tick || "process_control",
      agent_stop: normalizedLoadedPolicy.actionCategoryMap?.agent_stop || "process_control",
    };
    normalizedLoadedPolicy.version = 6;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 7) {
    normalizedLoadedPolicy.categoryActionClassMap = {
      ...(normalizedLoadedPolicy.categoryActionClassMap || {}),
      agent_control: normalizedLoadedPolicy.categoryActionClassMap?.agent_control || "process",
    };
    normalizedLoadedPolicy.categoryPolicies = {
      ...(normalizedLoadedPolicy.categoryPolicies || {}),
      agent_control: normalizedLoadedPolicy.categoryPolicies?.agent_control || {
        riskScore: 45,
        confidenceScore: 75,
        valueScore: 65,
        reversibilityScore: 55,
        maxMode: "confirm_required",
        safeMode: "simulate",
      },
    };
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      agent_start: "agent_control",
      agent_tick: "agent_control",
      agent_stop: "agent_control",
    };
    normalizedLoadedPolicy.actionPrefixCategoryMap = {
      ...(normalizedLoadedPolicy.actionPrefixCategoryMap || {}),
      "agent:": "agent_control",
    };
    normalizedLoadedPolicy.commandPrefixCategoryMap = {
      ...(normalizedLoadedPolicy.commandPrefixCategoryMap || {}),
      "agent:start ": "agent_control",
      "agent:tick ": "agent_control",
      "agent:stop ": "agent_control",
    };
    normalizedLoadedPolicy.version = 7;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 8) {
    normalizedLoadedPolicy.categoryActionClassMap = {
      ...(normalizedLoadedPolicy.categoryActionClassMap || {}),
      workflow_control: normalizedLoadedPolicy.categoryActionClassMap?.workflow_control || "process",
    };
    normalizedLoadedPolicy.categoryPolicies = {
      ...(normalizedLoadedPolicy.categoryPolicies || {}),
      workflow_control: normalizedLoadedPolicy.categoryPolicies?.workflow_control || {
        riskScore: 45,
        confidenceScore: 80,
        valueScore: 65,
        reversibilityScore: 55,
        maxMode: "confirm_required",
        safeMode: "simulate",
      },
    };
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      dashboard_agent: normalizedLoadedPolicy.actionCategoryMap?.dashboard_agent || "shell_read",
      review_list: normalizedLoadedPolicy.actionCategoryMap?.review_list || "shell_read",
      manager_route: normalizedLoadedPolicy.actionCategoryMap?.manager_route || "workflow_control",
      review_create: normalizedLoadedPolicy.actionCategoryMap?.review_create || "workflow_control",
    };
    normalizedLoadedPolicy.actionPrefixCategoryMap = {
      ...(normalizedLoadedPolicy.actionPrefixCategoryMap || {}),
      "manager:": normalizedLoadedPolicy.actionPrefixCategoryMap?.["manager:"] || "workflow_control",
      "review:": normalizedLoadedPolicy.actionPrefixCategoryMap?.["review:"] || "workflow_control",
    };
    normalizedLoadedPolicy.commandCategoryMap = {
      ...(normalizedLoadedPolicy.commandCategoryMap || {}),
      "review:list": normalizedLoadedPolicy.commandCategoryMap?.["review:list"] || "shell_read",
    };
    normalizedLoadedPolicy.commandPrefixCategoryMap = {
      ...(normalizedLoadedPolicy.commandPrefixCategoryMap || {}),
      "dashboard:agent ": normalizedLoadedPolicy.commandPrefixCategoryMap?.["dashboard:agent "] || "shell_read",
      "manager:route ": normalizedLoadedPolicy.commandPrefixCategoryMap?.["manager:route "] || "workflow_control",
      "review:create ": normalizedLoadedPolicy.commandPrefixCategoryMap?.["review:create "] || "workflow_control",
    };
    normalizedLoadedPolicy.version = 8;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 9) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      digest_health: normalizedLoadedPolicy.actionCategoryMap?.digest_health || "shell_read",
    };
    normalizedLoadedPolicy.commandCategoryMap = {
      ...(normalizedLoadedPolicy.commandCategoryMap || {}),
      "digest:health": normalizedLoadedPolicy.commandCategoryMap?.["digest:health"] || "shell_read",
    };
    normalizedLoadedPolicy.commandPrefixCategoryMap = {
      ...(normalizedLoadedPolicy.commandPrefixCategoryMap || {}),
      "digest:health": normalizedLoadedPolicy.commandPrefixCategoryMap?.["digest:health"] || "shell_read",
    };
    normalizedLoadedPolicy.version = 9;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 10) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      ownership_signals: normalizedLoadedPolicy.actionCategoryMap?.ownership_signals || "shell_read",
    };
    normalizedLoadedPolicy.version = 10;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 11) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      brief_list: normalizedLoadedPolicy.actionCategoryMap?.brief_list || "shell_read",
      report_list: normalizedLoadedPolicy.actionCategoryMap?.report_list || "shell_read",
      brief_create: normalizedLoadedPolicy.actionCategoryMap?.brief_create || "workflow_control",
      brief_route: normalizedLoadedPolicy.actionCategoryMap?.brief_route || "workflow_control",
      report_create: normalizedLoadedPolicy.actionCategoryMap?.report_create || "workflow_control",
      report_publish: normalizedLoadedPolicy.actionCategoryMap?.report_publish || "workflow_control",
    };
    normalizedLoadedPolicy.commandCategoryMap = {
      ...(normalizedLoadedPolicy.commandCategoryMap || {}),
      "brief:list": normalizedLoadedPolicy.commandCategoryMap?.["brief:list"] || "shell_read",
      "report:list": normalizedLoadedPolicy.commandCategoryMap?.["report:list"] || "shell_read",
    };
    normalizedLoadedPolicy.commandPrefixCategoryMap = {
      ...(normalizedLoadedPolicy.commandPrefixCategoryMap || {}),
      "brief:create ": normalizedLoadedPolicy.commandPrefixCategoryMap?.["brief:create "] || "workflow_control",
      "brief:route ": normalizedLoadedPolicy.commandPrefixCategoryMap?.["brief:route "] || "workflow_control",
      "report:create ": normalizedLoadedPolicy.commandPrefixCategoryMap?.["report:create "] || "workflow_control",
      "report:publish ": normalizedLoadedPolicy.commandPrefixCategoryMap?.["report:publish "] || "workflow_control",
    };
    normalizedLoadedPolicy.version = 11;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 12) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      workflow_route_task: normalizedLoadedPolicy.actionCategoryMap?.workflow_route_task || "workflow_control",
      job_detail: normalizedLoadedPolicy.actionCategoryMap?.job_detail || "shell_read",
      "workflow:route-task":
        normalizedLoadedPolicy.actionCategoryMap?.["workflow:route-task"] || "workflow_control",
      "job:detail": normalizedLoadedPolicy.actionCategoryMap?.["job:detail"] || "shell_read",
    };
    normalizedLoadedPolicy.version = 12;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 13) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      "workflow:create-task":
        normalizedLoadedPolicy.actionCategoryMap?.["workflow:create-task"] || "workflow_control",
    };
    normalizedLoadedPolicy.version = 13;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 14) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      "workflow:create-task": "workflow_control",
      "job:detail": "shell_read",
    };
    normalizedLoadedPolicy.version = 14;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 15) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      "job:cancel": "workflow_control",
      "job:retry": "workflow_control",
    };
    normalizedLoadedPolicy.actionPrefixCategoryMap = {
      ...(normalizedLoadedPolicy.actionPrefixCategoryMap || {}),
      "watcher:": "workflow_control",
      "alert:": "workflow_control",
    };
    normalizedLoadedPolicy.version = 15;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 16) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      "job:cancel": "workflow_control",
      "job:retry": "workflow_control",
      "watcher:start": "workflow_control",
      "watcher:stop": "workflow_control",
      "watcher:rule-upsert": "workflow_control",
      "watcher:rule-delete": "workflow_control",
      "alert:acknowledge": "workflow_control",
      "alert:resolve": "workflow_control",
      "alert:note": "workflow_control",
      "alert:run-checks": "workflow_control",
    };
    normalizedLoadedPolicy.version = 16;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 17) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      "policy:update-thresholds": "workflow_control",
      "policy:update-automation": "workflow_control",
      "agent:update-config": "agent_control",
      "review:approve": "workflow_control",
      "review:revise": "workflow_control",
      "review:followup": "workflow_control",
    };
    normalizedLoadedPolicy.version = 17;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 18) {
    normalizedLoadedPolicy.actionCategoryMap = {
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
      "collaboration:update-governance": "workflow_control",
      "collaboration:apply-approval-policy-recommendation": "workflow_control",
      "collaboration:promote-approval-policy-recommendation": "workflow_control",
      "collaboration:acknowledge-trust-alert": "workflow_control",
      "collaboration:restart-approval-recommendation-observation": "workflow_control",
      "collaboration:extend-approval-recommendation-cooldown": "workflow_control",
    };
    normalizedLoadedPolicy.version = 18;
  }
  if (Number(normalizedLoadedPolicy.version || 1) < 19) {
    normalizedLoadedPolicy.strictMode = normalizeStrictModeConfig(normalizedLoadedPolicy.strictMode);
    normalizedLoadedPolicy.version = 19;
  }

  const defaults = createDefaultPolicy();
  return {
    ...defaults,
    ...normalizedLoadedPolicy,
    identityRoleMap: {
      ...defaults.identityRoleMap,
      ...(normalizedLoadedPolicy.identityRoleMap || {}),
    },
    roleAliases: {
      ...defaults.roleAliases,
      ...(normalizedLoadedPolicy.roleAliases || {}),
    },
    roleModeCeilings: {
      ...defaults.roleModeCeilings,
      ...(normalizedLoadedPolicy.roleModeCeilings || {}),
    },
    categoryActionClassMap: {
      ...defaults.categoryActionClassMap,
      ...(normalizedLoadedPolicy.categoryActionClassMap || {}),
    },
    saferToolMap: {
      ...defaults.saferToolMap,
      ...(normalizedLoadedPolicy.saferToolMap || {}),
    },
    categoryPolicies: {
      ...defaults.categoryPolicies,
      ...(normalizedLoadedPolicy.categoryPolicies || {}),
    },
    actionCategoryMap: {
      ...defaults.actionCategoryMap,
      ...(normalizedLoadedPolicy.actionCategoryMap || {}),
    },
    actionPrefixCategoryMap: {
      ...defaults.actionPrefixCategoryMap,
      ...(normalizedLoadedPolicy.actionPrefixCategoryMap || {}),
    },
    commandCategoryMap: {
      ...defaults.commandCategoryMap,
      ...(normalizedLoadedPolicy.commandCategoryMap || {}),
    },
    commandPrefixCategoryMap: {
      ...defaults.commandPrefixCategoryMap,
      ...(normalizedLoadedPolicy.commandPrefixCategoryMap || {}),
    },
    strictMode: {
      ...defaults.strictMode,
      ...normalizeStrictModeConfig(normalizedLoadedPolicy.strictMode),
    },
  };
}

function loadControlPolicy() {
  return loadJsonDocument(
    "runtime-control-policy",
    CONTROL_POLICY_PATH,
    createDefaultPolicy,
    mergePolicyWithDefaults
  );
}

function fileExists(...segments) {
  return fs.existsSync(path.join(__dirname, "..", ...segments));
}

function normalizeDiscoveryResult(result) {
  const normalized = String(result || "").trim().toUpperCase();
  if (!DISCOVERY_RESULT_VALUES.has(normalized)) {
    throw new Error("GAP_INVALID_DISCOVERY_RESULT");
  }
  return normalized;
}

function discoverRuntimeFoundation(policy = loadControlPolicy()) {
  const discovery = {
    executionEngine: normalizeDiscoveryResult(fileExists("services", "executionEngine.js") ? "FOUND" : "UNKNOWN"),
    planner: normalizeDiscoveryResult(fileExists("services", "planner.js") ? "FOUND" : "UNKNOWN"),
    router: normalizeDiscoveryResult(fileExists("services", "toolRouter.js") ? "FOUND" : "UNKNOWN"),
  };
  if (
    discovery.executionEngine !== "FOUND" ||
    (discovery.planner !== "FOUND" && discovery.router !== "FOUND")
  ) {
    throw new Error("DISCOVERY INSUFFICIENT — MINIMUM EXECUTION SET NOT FOUND");
  }

  const configuredPrimary = String(policy.strictMode?.primaryReviewSurface || "").trim();
  const discoveredSurfaces = [];
  if (fileExists("app", "api", "console", "route.ts")) {
    discoveredSurfaces.push("api");
  }
  if (configuredPrimary === "ui" || fileExists("src", "server", "services", "console-runtime.ts")) {
    discoveredSurfaces.push("ui");
  }
  if (configuredPrimary === "cli" || fileExists("services", "legacyConsoleHandler.js")) {
    discoveredSurfaces.push("cli");
  }

  const uniqueSurfaces = [...new Set(discoveredSurfaces)];
  let primaryReviewSurface = "unknown";
  if (configuredPrimary && uniqueSurfaces.includes(configuredPrimary)) {
    primaryReviewSurface = configuredPrimary;
  } else if (uniqueSurfaces.includes("api")) {
    primaryReviewSurface = "api";
  } else if (uniqueSurfaces.length === 1) {
    primaryReviewSurface = uniqueSurfaces[0];
  } else if (uniqueSurfaces.length > 1) {
    throw new Error("GAP_REVIEW_SURFACE_AMBIGUOUS");
  }

  if (!REVIEW_SURFACE_VALUES.has(primaryReviewSurface)) {
    throw new Error("GAP_REVIEW_SURFACE_AMBIGUOUS");
  }

  return {
    components: discovery,
    reviewSurface: {
      primary: primaryReviewSurface,
      secondary: uniqueSurfaces.filter((surface) => surface !== primaryReviewSurface),
    },
  };
}

function parseTimeoutCandidate(value) {
  if (value == null || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}

function resolveSystemTimeoutSeconds(policy = loadControlPolicy(), env = process.env) {
  const candidates = [];
  const configValue = parseTimeoutCandidate(policy.strictMode?.systemTimeoutSeconds);
  if (configValue != null) {
    candidates.push({ source: "config", value: configValue });
  }

  const envCandidates = [
    { source: "SYSTEM_TIMEOUT_SECONDS", value: parseTimeoutCandidate(env.SYSTEM_TIMEOUT_SECONDS) },
    { source: "TIMEOUT_SECONDS", value: parseTimeoutCandidate(env.TIMEOUT_SECONDS) },
  ].filter((candidate) => candidate.value != null);
  candidates.push(...envCandidates);

  const distinctValues = [...new Set(candidates.map((candidate) => candidate.value))];
  if (distinctValues.length > 1) {
    throw new Error("GAP_TIMEOUT_CONFLICT");
  }

  if (distinctValues.length === 0) {
    return {
      seconds: 300,
      source: "default",
      events: ["TIMEOUT_DEFAULT_APPLIED"],
    };
  }

  return {
    seconds: distinctValues[0],
    source: candidates[0].source,
    events: [],
  };
}

function normalizeMode(mode, fallback = "blocked") {
  return Object.prototype.hasOwnProperty.call(MODE_ORDER, mode) ? mode : fallback;
}

function pickSaferMode(...modes) {
  return modes
    .filter(Boolean)
    .map((mode) => normalizeMode(mode))
    .sort((left, right) => MODE_ORDER[left] - MODE_ORDER[right])[0] || "blocked";
}

function modeAllows(mode, required) {
  return MODE_ORDER[normalizeMode(mode)] >= MODE_ORDER[normalizeMode(required)];
}

function isExecutionAuthorized(modes = {}) {
  return modes.controlApproved === true && normalizeMode(modes.executionMode) === "auto_execute";
}

function normalizeRoleName(role, policy) {
  const normalized = String(role || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  return policy.roleAliases?.[normalized] || normalized;
}

function resolveIdentity(actor = {}, options = {}, policy = loadControlPolicy()) {
  const sourceIdentity = String(options.identitySource || actor.identitySource || "human").trim().toLowerCase();
  const fallbackRole = policy.identityRoleMap?.[sourceIdentity] || "operator";
  const resolvedRole = normalizeRoleName(actor.role, policy) || fallbackRole;
  const maxExecutionMode = normalizeMode(policy.roleModeCeilings?.[resolvedRole], policy.defaultExecutionMode);

  return {
    sourceIdentity,
    role: resolvedRole,
    maxExecutionMode,
  };
}

function normalizeOperatorOverride(operatorOverride = null) {
  if (!operatorOverride || typeof operatorOverride !== "object") {
    return null;
  }

  const acknowledgment = String(
    operatorOverride.acknowledgment || operatorOverride.reason || operatorOverride.code || ""
  ).trim().toUpperCase();
  if (!OVERRIDE_ACKNOWLEDGMENTS.has(acknowledgment)) {
    return null;
  }

  const planId = String(operatorOverride.planId || "").trim() || null;
  const stepId = String(operatorOverride.stepId || "").trim() || null;
  if (!planId && !stepId) {
    return null;
  }

  return {
    planId,
    stepId,
    acknowledgment,
    comment: String(operatorOverride.comment || "").trim() || null,
  };
}

function buildContext({ actor = {}, modes = {}, workspaceId = null, sessionState = null, recentTasks = [], options = {} } = {}) {
  const discovery = discoverRuntimeFoundation(loadControlPolicy());
  return {
    safeMode: Boolean(modes.safe),
    dryRun: Boolean(modes.dryRun),
    confirmed: Boolean(modes.confirmed),
    operatorOverride: normalizeOperatorOverride(modes.operatorOverride),
    sessionState: sessionState || null,
    workspace: workspaceId || actor.workspaceId || null,
    recentTasks: Array.isArray(recentTasks) ? recentTasks : [],
    identity: resolveIdentity(actor, options),
    reviewSurface: discovery.reviewSurface,
  };
}

function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
}

function listPlanSteps(plan = null) {
  if (!plan) {
    return [];
  }
  if (Array.isArray(plan.steps)) {
    return plan.steps;
  }
  if (plan.action) {
    return [plan];
  }
  return [];
}

function lookupCategory(value, exactMap = {}, prefixMap = {}) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return null;
  }
  if (exactMap[normalized]) {
    return exactMap[normalized];
  }

  const matchedPrefix = Object.keys(prefixMap)
    .sort((left, right) => right.length - left.length)
    .find((prefix) => normalized.startsWith(prefix));

  return matchedPrefix ? prefixMap[matchedPrefix] : null;
}

function classifyStep(step = {}, policy = loadControlPolicy()) {
  const category =
    lookupCategory(step.action, policy.actionCategoryMap, policy.actionPrefixCategoryMap) ||
    (step.command ? lookupCategory(step.command, policy.commandCategoryMap, policy.commandPrefixCategoryMap) : null);
  const actionClass = category
    ? policy.categoryActionClassMap?.[category] || "execute"
    : "execute";

  if (!category) {
    return {
      category: "shell_mutation",
      actionClass,
      unclassified: true,
      policy: {
        riskScore: 100,
        confidenceScore: 50,
        valueScore: 40,
        reversibilityScore: 0,
        maxMode: "confirm_required",
        safeMode: "blocked",
      },
    };
  }

  return {
    category,
    actionClass,
    unclassified: false,
    policy: policy.categoryPolicies?.[category] || {
      riskScore: 100,
      confidenceScore: 50,
      valueScore: 40,
      reversibilityScore: 0,
      maxMode: "confirm_required",
      safeMode: "blocked",
    },
  };
}

function buildSyntheticPlan(request = {}) {
  if (request.plan) {
    return request.plan;
  }

  if (request.command) {
    return {
      type: "single",
      action: "__terminal_command__",
      command: String(request.command || "").trim(),
      payload: String(request.command || "").trim(),
      source: "control",
      planQuality: "synthetic",
      originalRequest: String(request.command || "").trim(),
    };
  }

  if (request.action) {
    return {
      type: "single",
      action: String(request.action || "").trim(),
      payload: request.payload || {},
      source: "control",
      planQuality: "synthetic",
      originalRequest: String(request.action || "").trim(),
    };
  }

  return null;
}

function normalizePlanQuality(planQuality, fallback = "structured_native") {
  const normalized = String(planQuality || fallback).trim();
  return VALID_PLAN_QUALITIES.has(normalized) ? normalized : fallback;
}

function normalizePlanCompleteness(planCompleteness, rawPlan = {}) {
  if (VALID_PLAN_COMPLETENESS.has(String(planCompleteness || "").trim())) {
    return String(planCompleteness).trim();
  }
  if (
    (Array.isArray(rawPlan.deferredItems) && rawPlan.deferredItems.length > 0) ||
    (Array.isArray(rawPlan.deferredStepIds) && rawPlan.deferredStepIds.length > 0)
  ) {
    return "partial";
  }
  return "full";
}

function validatePlannerFeedback(plannerFeedback) {
  if (plannerFeedback == null) {
    return [];
  }

  const entries = Array.isArray(plannerFeedback) ? plannerFeedback : [plannerFeedback];
  return entries.map((entry) => {
    const normalized = String(entry || "").trim();
    const lower = normalized.toLowerCase();
    const invalidExample = ["adjusted", "normalized", "ok", "fixed issue"].includes(lower);
    const hasTransformationDetail = /(split|decompos|reorder|rewrite|remove|downgrade|preview|checkpoint|verify|validate|defer|atomic|stage)/i.test(normalized);
    const hasRiskImplication = /(risk|safe|safety|failure|blast radius|prevent|avoid|reduce|reduced|confirm|block)/i.test(normalized);

    if (invalidExample || normalized.length < 30 || !hasTransformationDetail || !hasRiskImplication) {
      throw new Error("GAP_INVALID_PLANNER_FEEDBACK");
    }

    return normalized;
  });
}

function buildDeferredItems(deferredSteps = []) {
  return deferredSteps.map((step) => ({
    id: step.id,
    actionClass: step.actionClass,
    description: step.description,
    status: "deferred",
    reason: "Deferred to a later reviewed stage.",
  }));
}

function inferTool(step = {}) {
  if (step.tool) return String(step.tool);
  if (step.action && step.action !== "__terminal_command__") return String(step.action);
  if (step.command) return String(step.command);
  return "unknown";
}

function buildStepDescription(step = {}, actionClass = "execute") {
  if (step.description) {
    return String(step.description);
  }
  const tool = inferTool(step);
  if (tool === "__terminal_command__" && step.command) {
    return `Execute terminal command "${step.command}".`;
  }
  if (step.payload && typeof step.payload === "string") {
    return `${tool} ${step.payload}`.trim();
  }
  return `${actionClass} step via ${tool}`.trim();
}

function inferPrerequisite(step = {}, index, rawSteps = []) {
  if (Object.prototype.hasOwnProperty.call(step, "requiresPrerequisite")) {
    return step.requiresPrerequisite ?? null;
  }
  if ((step.payloadFrom === "previous" || step.contentFrom === "previous") && index > 0) {
    return rawSteps[index - 1]?.id || `step_${index}`;
  }
  return null;
}

function inferDeclaredSideEffects(actionClass, tool) {
  switch (actionClass) {
    case "read":
      return [];
    case "mutate":
      return ["workspace_state"];
    case "delete":
      return ["workspace_state", "destructive_change"];
    case "network":
      return ["network_state"];
    case "process":
      return ["process_state"];
    case "plugin":
      return tool === "run_plugin" ? ["plugin_state", "workspace_state"] : ["plugin_state"];
    case "execute":
    default:
      return ["shell_state"];
  }
}

function inferPermissions(actionClass, category) {
  switch (actionClass) {
    case "read":
      return ["read"];
    case "mutate":
      return ["file:write"];
    case "delete":
      return ["file:delete"];
    case "network":
      return category === "credential_access" ? ["credential:access"] : ["network:mutate"];
    case "process":
      return ["process:control"];
    case "plugin":
      return ["plugin:execute"];
    case "execute":
    default:
      return ["shell:execute"];
  }
}

function inferReversible(actionClass, tool) {
  if (tool === "append_file") {
    return false;
  }
  return actionClass === "read" || actionClass === "process";
}

function inferIntentCategory(steps = [], existingIntentCategory = null) {
  if (["read", "write", "mixed", "destructive"].includes(existingIntentCategory)) {
    return existingIntentCategory;
  }
  const actionClasses = new Set(steps.map((step) => step.actionClass));
  if (actionClasses.has("delete")) {
    return "destructive";
  }
  const hasRead = actionClasses.has("read");
  const hasRisk = [...actionClasses].some((actionClass) => actionClass !== "read");
  if (hasRead && hasRisk) return "mixed";
  if (hasRead) return "read";
  return "write";
}

function computePlanScoring(candidatePlan, context = {}, policy = loadControlPolicy()) {
  const scores = candidatePlan.steps.reduce(
    (aggregate, step) => ({
      riskScore: Math.max(aggregate.riskScore, Number(step.riskScore || 0)),
      confidenceScore: Math.min(aggregate.confidenceScore, Number(step.confidenceScore || 100)),
      valueScore: Math.max(aggregate.valueScore, Number(step.valueScore || 0)),
      reversibilityScore: Math.min(aggregate.reversibilityScore, Number(step.reversibilityScore || 100)),
    }),
    { riskScore: 0, confidenceScore: 100, valueScore: 0, reversibilityScore: 100 }
  );

  const categoryCeiling = candidatePlan.steps.reduce(
    (current, step) => pickSaferMode(current, normalizeMode(step.maxMode, policy.defaultExecutionMode)),
    "auto_execute"
  );
  const safeModeCeiling = candidatePlan.steps.reduce(
    (current, step) => pickSaferMode(current, normalizeMode(step.safeMode, policy.defaultExecutionMode)),
    "auto_execute"
  );
  const roleCeiling = normalizeMode(context.identity?.maxExecutionMode, policy.defaultExecutionMode);
  const unclassifiedExists = candidatePlan.steps.some((step) => step.unclassified);
  const credentialExists = candidatePlan.steps.some((step) => step.category === "credential_access");

  let desiredMode = "confirm_required";
  let reason = "control_review_required";
  let explanation = "Control review requires confirmation before execution.";

  if (credentialExists) {
    desiredMode = "blocked";
    reason = "credential_access_blocked";
    explanation = "Credential access is blocked by policy.";
  } else if (context.dryRun) {
    desiredMode = "simulate";
    reason = "dry_run_simulation";
    explanation = "Dry run requested, so execution is simulated with zero side effects.";
  } else if (context.safeMode) {
    desiredMode = safeModeCeiling;
    reason = desiredMode === "blocked" ? "safe_mode_blocked" : "safe_mode_simulation";
    explanation =
      desiredMode === "blocked"
        ? "Safe mode blocks this request because the planned actions are not safe to execute."
        : "Safe mode downgraded the request to simulation.";
  } else if (unclassifiedExists) {
    desiredMode = "confirm_required";
    reason = "unclassified_action_requires_confirmation";
    explanation = "An unclassified action was treated as shell_mutation and requires confirmation.";
  } else if (context.confirmed && modeAllows(roleCeiling, "confirm_required")) {
    desiredMode = "auto_execute";
    reason = "confirmed_execution";
    explanation = "User confirmation allows the reviewed plan to execute.";
  } else if (
    scores.riskScore <= Number(policy.lowRiskAutoExecuteThreshold || 0) &&
    modeAllows(categoryCeiling, "auto_execute") &&
    modeAllows(roleCeiling, "auto_execute")
  ) {
    desiredMode = "auto_execute";
    reason = "low_risk_auto_execute";
    explanation = "Policy allows low-risk execution without additional confirmation.";
  }

  const proposedMode = context.confirmed
    ? pickSaferMode(desiredMode, roleCeiling)
    : pickSaferMode(desiredMode, categoryCeiling, roleCeiling);
  return { scores, categoryCeiling, safeModeCeiling, roleCeiling, proposedMode, reason, explanation };
}

function normalizeCandidatePlan(plan, context = {}, policy = loadControlPolicy(), options = {}) {
  const rawPlan = plan || {};
  const rawSteps = listPlanSteps(rawPlan);
  const maxModifyCyclesPerStep = Math.max(0, Number(policy.strictMode?.maxModifyCyclesPerStep ?? 0) || 0);
  const normalizedSteps = rawSteps.map((step, index) => {
    const classification = classifyStep(step, policy);
    const actionClass = step.actionClass || classification.actionClass || "execute";
    const tool = inferTool(step);
    const modifyCount = Math.max(0, Number(step.modifyCount || 0) || 0);
    const modifyLimitReached = modifyCount > maxModifyCyclesPerStep;

    return {
      ...step,
      id: step.id || `step_${index + 1}`,
      actionClass,
      tool,
      description: buildStepDescription(step, actionClass),
      reversible: typeof step.reversible === "boolean" ? step.reversible : inferReversible(actionClass, tool),
      requiresPrerequisite: inferPrerequisite(step, index, rawSteps),
      declaredSideEffects: Array.isArray(step.declaredSideEffects)
        ? uniqueValues(step.declaredSideEffects)
        : inferDeclaredSideEffects(actionClass, tool),
      permissions: Array.isArray(step.permissions)
        ? uniqueValues(step.permissions)
        : inferPermissions(actionClass, classification.category),
      category: classification.category,
      unclassified: classification.unclassified,
      riskScore: Number(step.riskScore ?? classification.policy.riskScore ?? 0),
      confidenceScore: Number(step.confidenceScore ?? classification.policy.confidenceScore ?? 100),
      valueScore: Number(step.valueScore ?? classification.policy.valueScore ?? 0),
      reversibilityScore: Number(step.reversibilityScore ?? classification.policy.reversibilityScore ?? 100),
      maxMode: normalizeMode(step.maxMode || classification.policy.maxMode, policy.defaultExecutionMode),
      safeMode: normalizeMode(step.safeMode || classification.policy.safeMode, policy.defaultExecutionMode),
      modifyCount,
      status: modifyLimitReached ? "blocked" : String(step.status || "pending"),
      blockReason: modifyLimitReached ? "STEP_MODIFY_LIMIT_REACHED" : String(step.blockReason || ""),
    };
  });

  const intentCategory = inferIntentCategory(normalizedSteps, rawPlan.intentCategory);
  const basePlan = {
    ...rawPlan,
    originalRequest: String(rawPlan.originalRequest || options.originalRequest || "").trim(),
    actorRole: String(rawPlan.actorRole || context.identity?.role || "operator"),
    reviewStatus: ALL_REVIEW_STATUSES.has(rawPlan.reviewStatus) ? rawPlan.reviewStatus : "pending",
    planQuality: normalizePlanQuality(options.planQuality || rawPlan.planQuality, "structured_native"),
    planCompleteness: normalizePlanCompleteness(rawPlan.planCompleteness || options.planCompleteness, rawPlan),
    plannerFeedback: validatePlannerFeedback(rawPlan.plannerFeedback),
    steps: normalizedSteps,
    intentCategory,
  };
  const scoring = computePlanScoring(basePlan, context, policy);

  return {
    ...basePlan,
    proposedMode: normalizeMode(rawPlan.proposedMode || scoring.proposedMode, policy.defaultExecutionMode),
    deferredItems: Array.isArray(rawPlan.deferredItems) ? rawPlan.deferredItems : [],
    scoring,
  };
}

function createFinding({ id, severity, category, stepId, reason, explanation }) {
  return {
    id,
    severity,
    category,
    ...(stepId ? { stepId } : {}),
    reason,
    explanation,
  };
}

function isPreviewStep(step = {}) {
  return (
    step.actionClass === "read" ||
    ["list_files", "read_file", "diagnose_environment", "diagnose_path", "whyblocked", "list_plugins"].includes(step.tool)
  );
}

function inferExpectedSideEffects(step = {}) {
  return inferDeclaredSideEffects(step.actionClass, step.tool);
}

function runPlanReviewer(candidatePlan, context = {}, policy = loadControlPolicy()) {
  const findings = [];
  const riskySteps = candidatePlan.steps.filter((step) =>
    ["mutate", "delete", "execute", "network", "process", "plugin"].includes(step.actionClass)
  );

  if (candidatePlan.planQuality === "synthetic") {
    findings.push(createFinding({
      id: "synthetic_plan_requires_validation",
      severity: "critical",
      category: "assumption_risk",
      reason: "Synthetic plans require planner validation or explicit operator override before execution.",
      explanation: "The candidate plan was synthesized without planner validation, so execution must not proceed on implicit trust.",
    }));
  }

  if (candidatePlan.intentCategory === "read") {
    candidatePlan.steps.forEach((step) => {
      if (["mutate", "delete", "process", "network", "plugin", "execute"].includes(step.actionClass)) {
        findings.push(createFinding({
          id: `mutation_on_read_only_intent_${step.id}`,
          severity: "critical",
          category: "scope_drift",
          stepId: step.id,
          reason: "Read-only intent includes a mutating or execution-oriented step.",
          explanation: `The request was classified as read-only, but ${step.tool} is a ${step.actionClass} action.`,
        }));
      }
    });
  }

  if (riskySteps.length > 1) {
    findings.push(createFinding({
      id: "multi_risk_bundle",
      severity: riskySteps.length > 2 ? "critical" : "warning",
      category: "bundling_risk",
      reason: "Multiple risky steps were bundled into one candidate plan.",
      explanation: `The plan contains ${riskySteps.length} risky steps, which increases the blast radius of a single approval.`,
    }));
  }

  candidatePlan.steps.forEach((step, index) => {
    if (step.blockReason === "STEP_MODIFY_LIMIT_REACHED") {
      findings.push(createFinding({
        id: `modify_limit_${step.id}`,
        severity: "critical",
        category: "permission_mismatch",
        stepId: step.id,
        reason: "The step exceeded the maximum allowed modify cycles.",
        explanation: `${step.tool} reached modifyCount ${step.modifyCount}, which exceeds the configured limit of ${policy.strictMode?.maxModifyCyclesPerStep}.`,
      }));
    }

    const prerequisiteIndex = step.requiresPrerequisite
      ? candidatePlan.steps.findIndex((candidate) => candidate.id === step.requiresPrerequisite)
      : -1;

    if ((step.payloadFrom === "previous" || step.contentFrom === "previous") && index === 0) {
      findings.push(createFinding({
        id: `order_error_${step.id}`,
        severity: "critical",
        category: "order_error",
        stepId: step.id,
        reason: "The step depends on a previous result, but no prior step exists.",
        explanation: `${step.tool} references the previous result without a prerequisite producer.`,
      }));
    }

    if (step.requiresPrerequisite && prerequisiteIndex === -1) {
      findings.push(createFinding({
        id: `missing_prerequisite_check_${step.id}`,
        severity: "warning",
        category: "assumption_risk",
        stepId: step.id,
        reason: "A declared prerequisite is not present in the plan.",
        explanation: `${step.tool} depends on ${step.requiresPrerequisite}, but that prerequisite is not included in the candidate plan.`,
      }));
    } else if (step.requiresPrerequisite && prerequisiteIndex >= index) {
      findings.push(createFinding({
        id: `order_error_prerequisite_${step.id}`,
        severity: "critical",
        category: "order_error",
        stepId: step.id,
        reason: "A prerequisite appears after the step that depends on it.",
        explanation: `${step.tool} depends on ${step.requiresPrerequisite}, but the prerequisite is scheduled later in the plan.`,
      }));
    }

    const saferTool = policy.saferToolMap?.[step.tool];
    if (saferTool && saferTool.actionClass === step.actionClass) {
      findings.push(createFinding({
        id: `safer_tool_available_${step.id}`,
        severity: "warning",
        category: "tool_mismatch",
        stepId: step.id,
        reason: "A safer existing tool is available for the same action class.",
        explanation: saferTool.reason || `${saferTool.tool} is available as a safer alternative to ${step.tool}.`,
      }));
    }

    if (!step.reversible && !candidatePlan.steps.slice(0, index).some(isPreviewStep)) {
      findings.push(createFinding({
        id: `irreversible_action_without_preview_${step.id}`,
        severity: "critical",
        category: "hidden_side_effect",
        stepId: step.id,
        reason: "An irreversible step lacks a preview or checkpoint before execution.",
        explanation: `${step.tool} is not reversible and no earlier preview/checkpoint step exists in the plan.`,
      }));
    }

    const missingSideEffects = inferExpectedSideEffects(step).filter(
      (expected) => !step.declaredSideEffects.includes(expected)
    );
    if (missingSideEffects.length) {
      findings.push(createFinding({
        id: `hidden_side_effect_escalation_${step.id}`,
        severity: missingSideEffects.includes("destructive_change") ? "critical" : "warning",
        category: "hidden_side_effect",
        stepId: step.id,
        reason: "Likely impact exceeds the declared side effects.",
        explanation: `${step.tool} appears to have undeclared side effects: ${missingSideEffects.join(", ")}.`,
      }));
    }
  });

  const roleCeiling = normalizeMode(context.identity?.maxExecutionMode, policy.defaultExecutionMode);
  if (!modeAllows(roleCeiling, candidatePlan.proposedMode)) {
    findings.push(createFinding({
      id: "actor_permission_tension",
      severity: "critical",
      category: "permission_mismatch",
      reason: "The proposed mode exceeds the actor's configured execution ceiling.",
      explanation: `The actor is capped at ${roleCeiling}, but the candidate plan proposed ${candidatePlan.proposedMode}.`,
    }));
  } else if (candidatePlan.proposedMode === roleCeiling && candidatePlan.proposedMode !== "simulate") {
    findings.push(createFinding({
      id: "actor_permission_tension_ceiling",
      severity: "warning",
      category: "permission_mismatch",
      reason: "The candidate plan sits at the actor's execution ceiling.",
      explanation: `The actor is already at the maximum allowed mode of ${roleCeiling}, so a safer downgrade may be appropriate.`,
    }));
  }

  return {
    originalRequest: candidatePlan.originalRequest,
    summary: findings.length
      ? `Reviewer found ${findings.length} issue${findings.length === 1 ? "" : "s"} in the candidate plan.`
      : "Reviewer found no structural issues in the candidate plan.",
    findings,
  };
}

function createHypothesis(id, severity, reason, explanation) {
  return { id, severity, reason, explanation };
}

function runSecondThought(candidatePlan, reviewResult) {
  const findings = reviewResult.findings || [];
  const hypotheses = [];
  const riskySteps = candidatePlan.steps.filter((step) =>
    ["mutate", "delete", "execute", "network", "process", "plugin"].includes(step.actionClass)
  );

  if (riskySteps.length && candidatePlan.steps.some((step) => step.actionClass === "read")) {
    hypotheses.push(createHypothesis(
      "preview_first_stage",
      "warning",
      "A preview-first stage may reduce execution risk.",
      "The plan already contains read-only steps that could be run first to validate state before any risky step proceeds."
    ));
  }
  if (candidatePlan.steps.some((step) => ["plugin", "process", "network"].includes(step.actionClass))) {
    hypotheses.push(createHypothesis(
      "hidden_dependency_failure",
      "critical",
      "External or runtime dependencies may fail even if the plan is structurally valid.",
      "Plugin, process, or network-oriented steps can fail because of runtime state, availability, or side effects that are not fully visible in the candidate plan."
    ));
  }
  if (findings.some((finding) => finding.id === "multi_risk_bundle")) {
    hypotheses.push(createHypothesis(
      "split_for_blast_radius",
      "warning",
      "The request may be safer if it is split into smaller reviewed stages.",
      "Separating high-risk steps would reduce the blast radius of a single approval or execution decision."
    ));
  }
  if (candidatePlan.intentCategory === "mixed" && riskySteps.length) {
    hypotheses.push(createHypothesis(
      "broader_effect_than_requested",
      "warning",
      "The request may have broader effect than the user expects.",
      "Mixed plans combine inspection and mutation, which can make the user think they are still in a preview path when they are not."
    ));
  }

  return {
    originalRequest: candidatePlan.originalRequest,
    summary: hypotheses.length
      ? `Second thought generated ${hypotheses.length} adversarial hypothesis${hypotheses.length === 1 ? "" : "es"}.`
      : "Second thought found no additional adversarial concerns.",
    hypotheses,
  };
}

function reorderStepsByPrerequisite(steps = []) {
  const reordered = [...steps];
  let changed = false;

  for (let index = 0; index < reordered.length; index += 1) {
    const step = reordered[index];
    if (!step.requiresPrerequisite) {
      continue;
    }

    const prerequisiteIndex = reordered.findIndex((candidate) => candidate.id === step.requiresPrerequisite);
    if (prerequisiteIndex > index) {
      const [prerequisite] = reordered.splice(prerequisiteIndex, 1);
      reordered.splice(index, 0, prerequisite);
      changed = true;
    }
  }

  return { steps: reordered, changed };
}

function buildInterventionSummary(recommendedAction, finalMode) {
  switch (recommendedAction) {
    case "block":
      return "Intervention blocked the candidate plan.";
    case "split_plan":
      return `Intervention split the candidate plan into a safer executable stage with final mode ${finalMode}.`;
    case "rewrite_plan":
      return `Intervention rewrote the candidate plan for safer sequencing with final mode ${finalMode}.`;
    case "downgrade_mode":
      return `Intervention downgraded the candidate plan to ${finalMode}.`;
    case "approve":
    default:
      return `Intervention approved the candidate plan with final mode ${finalMode}.`;
  }
}

function validateRewriteScope(originalSteps = [], rewrittenSteps = []) {
  const originalActionClasses = new Set(originalSteps.map((step) => step.actionClass));
  return rewrittenSteps.every((step) => originalActionClasses.has(step.actionClass));
}

function runInterventionEngine(candidatePlan, reviewResult, secondThoughtResult, context = {}, policy = loadControlPolicy()) {
  const discovery = discoverRuntimeFoundation(policy);
  const findings = [...(reviewResult.findings || [])];
  const hypotheses = secondThoughtResult.hypotheses || [];
  const explicitConfirmation = Boolean(context.confirmed);
  const hasBundlingRisk = findings.some((finding) => finding.id === "multi_risk_bundle");
  const hasOrderError = findings.some((finding) => finding.category === "order_error");
  const hasPermissionTension = findings.some((finding) => finding.id === "actor_permission_tension");
  const hasPreviewConcern = findings.some((finding) => finding.id.startsWith("irreversible_action_without_preview"));
  const hasPreviewStage = candidatePlan.steps.some((step) => step.actionClass === "read");
  const hasBlockedStep = candidatePlan.steps.some((step) => step.status === "blocked");
  const plannerAvailable = discovery.components.planner === "FOUND";
  const operatorOverride = context.operatorOverride;

  let recommendedAction = "approve";
  let reviewStatus = "approved";
  let finalMode = normalizeMode(candidatePlan.proposedMode, policy.defaultExecutionMode);
  let executableSteps = [...candidatePlan.steps];
  let rewrittenSteps;
  let deferredStepIds = [];
  let deferredItems = candidatePlan.planCompleteness === "partial" ? candidatePlan.deferredItems || [] : [];

  if (candidatePlan.planQuality === "synthetic") {
    if (plannerAvailable) {
      recommendedAction = "block";
      reviewStatus = "blocked";
      finalMode = "blocked";
      executableSteps = [];
    } else {
      findings.push(createFinding({
        id: "planner_unavailable",
        severity: "critical",
        category: "assumption_risk",
        reason: "Planner validation is unavailable for a synthetic plan.",
        explanation: "Synthetic plans may proceed only after explicit operator override when the planner is unavailable.",
      }));
      recommendedAction = "block";
      reviewStatus = "blocked";
      finalMode = "blocked";
      executableSteps = [];
    }
  } else if (
    finalMode === "blocked" ||
    findings.some((finding) => finding.category === "scope_drift" && finding.severity === "critical") ||
    findings.some((finding) => finding.id === "actor_permission_tension") ||
    hasBlockedStep
  ) {
    recommendedAction = "block";
    reviewStatus = "blocked";
    finalMode = "blocked";
    executableSteps = [];
  } else if (hasOrderError) {
    const reordered = reorderStepsByPrerequisite(candidatePlan.steps);
    if (reordered.changed) {
      recommendedAction = "rewrite_plan";
      reviewStatus = "rewritten";
      finalMode = pickSaferMode(finalMode, "confirm_required");
      executableSteps = reordered.steps;
      rewrittenSteps = reordered.steps;
    } else {
      recommendedAction = "block";
      reviewStatus = "blocked";
      finalMode = "blocked";
      executableSteps = [];
    }
  } else if ((hasBundlingRisk || hypotheses.some((hypothesis) => hypothesis.id === "split_for_blast_radius")) && hasPreviewStage) {
    const previewSteps = candidatePlan.steps.filter((step) => step.actionClass === "read");
    const remainingSteps = candidatePlan.steps.filter((step) => step.actionClass !== "read");

    if (previewSteps.length && remainingSteps.length) {
      const previewCandidate = normalizeCandidatePlan(
        {
          ...candidatePlan,
          steps: previewSteps,
          intentCategory: "read",
          reviewStatus: "pending",
          planCompleteness: "partial",
        },
        context,
        policy,
        { originalRequest: candidatePlan.originalRequest }
      );

      recommendedAction = "split_plan";
      reviewStatus = "split";
      finalMode = previewCandidate.proposedMode;
      executableSteps = previewCandidate.steps;
      rewrittenSteps = previewCandidate.steps;
      deferredStepIds = remainingSteps.map((step) => step.id);
      deferredItems = buildDeferredItems(remainingSteps);
    }
  } else if (
    !explicitConfirmation &&
    (hasPreviewConcern || hasPermissionTension || hypotheses.some((hypothesis) => hypothesis.id === "preview_first_stage"))
  ) {
    recommendedAction = "downgrade_mode";
    reviewStatus = "downgraded";
    finalMode = pickSaferMode(finalMode, "confirm_required");
  }

  if (
    operatorOverride &&
    reviewStatus === "blocked" &&
    context.reviewSurface?.primary !== "unknown" &&
    (
      operatorOverride.acknowledgment === "BLOCKED_STATE" ||
      (!plannerAvailable && operatorOverride.acknowledgment === "PLANNER_UNAVAILABLE") ||
      candidatePlan.planQuality === "synthetic"
    )
  ) {
    appendAuditEvent({
      type: "operator_override",
      eventType: "operator_override",
      actor: "operator",
      message: `Operator override acknowledged ${operatorOverride.acknowledgment}.`,
      payload: {
        acknowledgment: operatorOverride.acknowledgment,
        planId: operatorOverride.planId,
        stepId: operatorOverride.stepId,
        originalRequest: candidatePlan.originalRequest,
      },
    });

    recommendedAction = explicitConfirmation ? "approve" : "downgrade_mode";
    reviewStatus = explicitConfirmation ? "approved" : "downgraded";
    finalMode = explicitConfirmation
      ? pickSaferMode(candidatePlan.proposedMode, context.identity?.maxExecutionMode || "confirm_required")
      : "confirm_required";
    executableSteps = candidatePlan.steps.map((step) => ({
      ...step,
      status: "approved",
      blockReason: "",
    }));
  }

  if (operatorOverride && context.reviewSurface?.primary === "unknown") {
    throw new Error("GAP_OPERATOR_OVERRIDE_UNAVAILABLE");
  }

  if (!validateRewriteScope(candidatePlan.steps, executableSteps)) {
    return {
      originalRequest: candidatePlan.originalRequest,
      summary: "Intervention blocked the candidate plan because a rewrite would widen scope.",
      findings: [
        ...findings,
        createFinding({
          id: "rewrite_scope_widening",
          severity: "critical",
          category: "scope_drift",
          reason: "A rewrite would introduce a new action class.",
          explanation: "Intervention may not widen scope beyond the action classes present in the candidate plan.",
        }),
      ],
      hypotheses,
      recommendedAction: "block",
      reviewStatus: "blocked",
      finalMode: "blocked",
      currentStageExecutable: false,
      steps: [],
      deferredItems,
    };
  }

  return {
    originalRequest: candidatePlan.originalRequest,
    summary: buildInterventionSummary(recommendedAction, finalMode),
    findings,
    hypotheses,
    recommendedAction,
    reviewStatus,
    finalMode,
    ...(rewrittenSteps ? { rewrittenSteps } : {}),
    ...(deferredStepIds.length ? { deferredStepIds } : {}),
    ...(deferredItems.length ? { deferredItems } : {}),
    currentStageExecutable: reviewStatus !== "blocked" && executableSteps.length > 0,
    steps: executableSteps,
  };
}

function getReviewIntelligenceConfig(policy = loadControlPolicy()) {
  const strictMode = policy.strictMode || {};
  return {
    lookbackLimit: Math.max(1, Number(strictMode.reviewIntelligenceLookbackLimit ?? 50) || 50),
    lookbackWindowMs: Math.max(1, Number(strictMode.reviewIntelligenceLookbackDays ?? 7) || 7) * 24 * 60 * 60 * 1000,
  };
}

function toTimestamp(value) {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getRecentReviewHistory(policy = loadControlPolicy()) {
  const config = getReviewIntelligenceConfig(policy);
  const now = Date.now();
  return (loadReviewSurfaceState().reviews || [])
    .filter((review) => now - toTimestamp(review.updatedAt || review.createdAt) <= config.lookbackWindowMs)
    .sort((left, right) => toTimestamp(right.updatedAt || right.createdAt) - toTimestamp(left.updatedAt || left.createdAt))
    .slice(0, config.lookbackLimit);
}

function buildStepFingerprint(step = {}) {
  return `${String(step.actionClass || step.intent || "unknown")}:${String(step.tool || step.commandPreview || step.intent || step.id || "unknown")}`;
}

function buildPlanFingerprint(steps = []) {
  return steps.map((step) => buildStepFingerprint(step)).sort();
}

function buildHistoryFingerprint(review = {}) {
  return buildPlanFingerprint(Array.isArray(review.steps) ? review.steps : []);
}

function countSharedEntries(left = [], right = []) {
  const rightSet = new Set(right);
  return left.filter((entry) => rightSet.has(entry)).length;
}

function findComparableHistory(reviewedPlan, history = []) {
  const currentFingerprint = buildPlanFingerprint(reviewedPlan.steps || []);
  if (!currentFingerprint.length) {
    return null;
  }

  let bestMatch = null;
  let bestScore = -1;
  for (const review of history) {
    const score = countSharedEntries(currentFingerprint, buildHistoryFingerprint(review));
    if (score > bestScore) {
      bestMatch = review;
      bestScore = score;
    }
  }
  return bestScore > 0 ? bestMatch : history[0] || null;
}

function buildDeltaAnalysis(reviewedPlan, policy = loadControlPolicy()) {
  const history = getRecentReviewHistory(policy);
  if (!history.length) {
    return {
      status: "degraded",
      reasonCode: "NO_HISTORY_AVAILABLE",
      summary: "Delta analysis degraded because no bounded review history is available.",
      novelty: "unverified",
      changed: null,
      changedFields: [],
      comparisonBasis: null,
    };
  }

  const comparable = findComparableHistory(reviewedPlan, history);
  if (!comparable) {
    return {
      status: "degraded",
      reasonCode: "NO_COMPARABLE_HISTORY",
      summary: "Delta analysis degraded because no comparable review record was found in the bounded history window.",
      novelty: "unverified",
      changed: null,
      changedFields: [],
      comparisonBasis: null,
    };
  }

  const currentFingerprint = buildPlanFingerprint(reviewedPlan.steps || []);
  const previousFingerprint = buildHistoryFingerprint(comparable);
  const changedFields = [];
  const currentMode = String(reviewedPlan.finalMode || reviewedPlan.proposedMode || "blocked");
  const previousMode = String(comparable.executionMode || "blocked");

  if (currentMode !== previousMode) {
    changedFields.push("executionMode");
  }
  if (currentFingerprint.length !== previousFingerprint.length) {
    changedFields.push("stepCount");
  }
  if (currentFingerprint.join("|") !== previousFingerprint.join("|")) {
    changedFields.push("stepFingerprint");
  }

  let novelty = "similar_repeat";
  if (!previousFingerprint.length) {
    novelty = "unverified";
  } else if (!countSharedEntries(currentFingerprint, previousFingerprint)) {
    novelty = "new_request";
  } else if (currentFingerprint.length > previousFingerprint.length) {
    novelty = "expanded_scope";
  } else if (currentFingerprint.length < previousFingerprint.length) {
    novelty = "reduced_scope";
  } else if (currentMode !== previousMode) {
    novelty = "mode_shift";
  }

  const changed = changedFields.length > 0;
  return {
    status: "available",
    reasonCode: "DELTA_COMPARISON_AVAILABLE",
    summary: changed
      ? `Delta analysis found ${changedFields.join(", ")} change${changedFields.length === 1 ? "" : "s"} relative to the most comparable recent review.`
      : "Delta analysis found no material change relative to the most comparable recent review.",
    novelty,
    changed,
    changedFields,
    comparisonBasis: {
      runId: comparable.runId || null,
      reviewedAt: comparable.updatedAt || comparable.createdAt || null,
    },
  };
}

function normalizeEvidenceBackedItem(item = {}, fallback = {}) {
  const sourceType = item.sourceType || fallback.sourceType || "";
  const sourceField = item.sourceField || fallback.sourceField || "";
  const reasonCode = item.reasonCode || fallback.reasonCode || "";
  const complete = Boolean(sourceType && sourceField && reasonCode);
  const baseConfidence = Number.isFinite(Number(item.confidenceScore))
    ? Number(item.confidenceScore)
    : Number.isFinite(Number(fallback.confidenceScore))
      ? Number(fallback.confidenceScore)
      : 0.5;
  return {
    ...item,
    priority: complete ? String(item.priority || "medium") : "low",
    sourceType: complete ? sourceType : sourceType || "derived",
    sourceField: complete ? sourceField : sourceField || "unknown",
    reasonCode: complete ? reasonCode : "EVIDENCE_INCOMPLETE",
    confidenceScore: complete ? Math.max(0, Math.min(1, baseConfidence)) : Math.min(0.4, Math.max(0, Math.min(1, baseConfidence))),
    advisoryState: complete ? "advisory_complete" : "advisory_incomplete",
    ...(item.historicalBasis ? { historicalBasis: item.historicalBasis } : {}),
  };
}

function buildOperatorPatternInsights(intervention, policy = loadControlPolicy()) {
  const history = getRecentReviewHistory(policy);
  if (!history.length) {
    return {
      status: "degraded",
      reasonCode: "NO_HISTORY_AVAILABLE",
      summary: "Operator pattern insights degraded because no bounded review history is available.",
      insights: [],
    };
  }

  const pendingCount = history.filter((review) => String(review.status || "") === "pending").length;
  const blockedCount = history.filter((review) => String(review.status || "") === "blocked").length;
  const highRiskCount = history.flatMap((review) => review.steps || []).filter((step) => String(step.riskLevel || "") === "high").length;
  const insights = [];

  if (pendingCount >= Math.ceil(history.length / 2)) {
    insights.push(normalizeEvidenceBackedItem({
      id: "recent_manual_review_pressure",
      priority: "medium",
      title: "Recent reviews are clustering in manual-review states.",
      detail: `${pendingCount} of ${history.length} recent review records are still pending.`,
      sourceType: "review_surface",
      sourceField: "status",
      reasonCode: "RECENT_PENDING_REVIEW_PRESSURE",
      historicalBasis: { pendingCount, sampleSize: history.length },
    }));
  }

  if (blockedCount > 0) {
    insights.push(normalizeEvidenceBackedItem({
      id: "recent_blocked_reviews_present",
      priority: "medium",
      title: "Recent blocked reviews increase the need for careful operator inspection.",
      detail: `${blockedCount} recent review record${blockedCount === 1 ? "" : "s"} ended in a blocked state.`,
      sourceType: "review_surface",
      sourceField: "status",
      reasonCode: "RECENT_BLOCKED_REVIEW_PATTERN",
      historicalBasis: { blockedCount, sampleSize: history.length },
    }));
  }

  if (highRiskCount > 0) {
    insights.push(normalizeEvidenceBackedItem({
      id: "recent_high_risk_density",
      priority: "low",
      title: "Recent reviews include high-risk steps.",
      detail: `${highRiskCount} high-risk step${highRiskCount === 1 ? "" : "s"} appear in the bounded review history.`,
      sourceType: "review_surface",
      sourceField: "steps.riskLevel",
      reasonCode: "RECENT_HIGH_RISK_REVIEW_DENSITY",
      historicalBasis: { highRiskCount, sampleSize: history.length },
    }));
  }

  return {
    status: "partial",
    reasonCode: "OPERATOR_DECISION_HISTORY_UNAVAILABLE",
    summary: insights.length
      ? "Advisory review-surface patterns are available, but verified operator decision history is not."
      : "No strong advisory review-surface pattern stands out in the bounded history window.",
    insights,
  };
}

function selectAdaptiveReviewMode(reviewedPlan, intervention, deltaAnalysis, operatorPatternInsights) {
  const riskScore = Number(reviewedPlan.scoring?.scores?.riskScore ?? 100);
  const confidenceScore = Number(reviewedPlan.scoring?.scores?.confidenceScore ?? 0);
  const policyBlocked = intervention.reviewStatus === "blocked" || intervention.finalMode === "blocked";
  const uncertaintyHigh =
    confidenceScore < 70 ||
    deltaAnalysis.status !== "available" ||
    reviewedPlan.planQuality === "synthetic" ||
    (intervention.findings || []).some((finding) => finding.category === "assumption_risk" && finding.severity !== "info");

  if (policyBlocked) {
    return {
      reviewMode: "deep",
      reviewModeReason: "Policy blockers or blocked execution state require the deepest operator review.",
    };
  }
  if (riskScore >= 70) {
    return {
      reviewMode: "deep",
      reviewModeReason: "Elevated risk score requires deep review before operator approval.",
    };
  }
  if (uncertaintyHigh) {
    return {
      reviewMode: "deep",
      reviewModeReason: "Uncertainty is elevated, so review depth is increased conservatively.",
    };
  }
  if (["expanded_scope", "mode_shift", "new_request"].includes(deltaAnalysis.novelty)) {
    return {
      reviewMode: "standard",
      reviewModeReason: "Novel or changed review shape requires standard review with delta attention.",
    };
  }
  if ((operatorPatternInsights.insights || []).length) {
    return {
      reviewMode: "standard",
      reviewModeReason: "Recent advisory review patterns warrant standard operator attention.",
    };
  }
  return {
    reviewMode: "minimal",
    reviewModeReason: "Risk and uncertainty are low enough for a compressed operator review.",
  };
}

function buildRecommendationPayload(reviewedPlan, intervention, deltaAnalysis, operatorPatternInsights) {
  if (intervention.reviewStatus === "blocked") {
    return normalizeEvidenceBackedItem({
      id: "recommendation_blocked_review",
      priority: "high",
      title: "Do not approve execution from the current review state.",
      detail: "Resolve the blocking finding or use an explicit reviewed override path before execution is reconsidered.",
      sourceType: "intervention",
      sourceField: "reviewStatus",
      reasonCode: "BLOCKED_REVIEW_STATE",
    });
  }

  if (reviewedPlan.finalMode === "confirm_required") {
    return normalizeEvidenceBackedItem({
      id: "recommendation_preview_or_confirm",
      priority: "high",
      title: "Use a deliberate review pass before execution.",
      detail: intervention.reviewStatus === "split"
        ? "Review the preview-first stage before approving any deferred steps."
        : "This path still requires explicit confirmation before any execution should proceed.",
      sourceType: "intervention",
      sourceField: "finalMode",
      reasonCode: "CONFIRMATION_REQUIRED",
    });
  }

  if (["expanded_scope", "mode_shift", "new_request"].includes(deltaAnalysis.novelty)) {
    return normalizeEvidenceBackedItem({
      id: "recommendation_review_delta",
      priority: "medium",
      title: "Review the changed elements before approving.",
      detail: deltaAnalysis.summary,
      sourceType: "review_surface",
      sourceField: "reviews",
      reasonCode: deltaAnalysis.reasonCode,
      historicalBasis: deltaAnalysis.comparisonBasis,
    });
  }

  if ((operatorPatternInsights.insights || []).length) {
    return normalizeEvidenceBackedItem({
      id: "recommendation_pattern_aware_review",
      priority: "medium",
      title: "Factor recent review pressure into this decision.",
      detail: operatorPatternInsights.summary,
      sourceType: "review_surface",
      sourceField: "reviews",
      reasonCode: operatorPatternInsights.reasonCode,
    });
  }

  return normalizeEvidenceBackedItem({
    id: "recommendation_standard_review",
    priority: "low",
    title: "A compact review pass is sufficient.",
    detail: "No strong blockers, novelty spikes, or advisory pattern pressures are present in the available evidence.",
    sourceType: "candidate_plan",
    sourceField: "scoring.scores",
    reasonCode: "LOW_RISK_REVIEW_PATH",
  });
}

function buildAttentionPoints(reviewedPlan, intervention, deltaAnalysis, operatorPatternInsights) {
  const points = [];

  (intervention.findings || [])
    .filter((finding) => finding.severity === "critical" || finding.severity === "warning")
    .slice(0, 3)
    .forEach((finding) => {
      points.push(normalizeEvidenceBackedItem({
        id: `attention_finding_${finding.id}`,
        priority: finding.severity === "critical" ? "high" : "medium",
        title: finding.reason,
        detail: finding.explanation,
        sourceType: "intervention",
        sourceField: "findings",
        reasonCode: finding.id,
      }));
    });

  if (deltaAnalysis.status === "available" && deltaAnalysis.changed) {
    points.push(normalizeEvidenceBackedItem({
      id: "attention_delta_change",
      priority: ["expanded_scope", "new_request", "mode_shift"].includes(deltaAnalysis.novelty) ? "high" : "medium",
      title: "This review differs from recent history.",
      detail: deltaAnalysis.summary,
      sourceType: "review_surface",
      sourceField: "reviews",
      reasonCode: deltaAnalysis.reasonCode,
      historicalBasis: deltaAnalysis.comparisonBasis,
    }));
  } else if (deltaAnalysis.status !== "available") {
    points.push(normalizeEvidenceBackedItem({
      id: "attention_delta_degraded",
      title: "Historical delta evidence is incomplete.",
      detail: deltaAnalysis.summary,
    }));
  }

  if (operatorPatternInsights.status !== "degraded") {
    points.push(
      ...(operatorPatternInsights.insights || []).slice(0, 2).map((insight) =>
        normalizeEvidenceBackedItem({
          ...insight,
          id: `attention_${insight.id}`,
        })
      )
    );
  } else {
    points.push(normalizeEvidenceBackedItem({
      id: "attention_pattern_degraded",
      title: "Operator pattern evidence is incomplete.",
      detail: operatorPatternInsights.summary,
    }));
  }

  return points.slice(0, 5);
}

function buildCompressedSummary(reviewMode, reviewModeReason, recommendation, attentionPoints = [], deltaAnalysis, operatorPatternInsights) {
  const bullets = [
    reviewModeReason,
    recommendation?.detail || null,
    deltaAnalysis?.summary || null,
    operatorPatternInsights?.summary || null,
    ...attentionPoints.slice(0, 2).map((point) => point.title || point.detail || null),
  ].filter(Boolean).slice(0, 4);

  return {
    headline: `${reviewMode.toUpperCase()} review`,
    bullets,
    degraded: deltaAnalysis?.status === "degraded" || operatorPatternInsights?.status === "degraded",
  };
}

function buildAdaptiveReviewPayload(reviewedPlan, intervention, policy = loadControlPolicy()) {
  const deltaAnalysis = buildDeltaAnalysis(reviewedPlan, policy);
  const operatorPatternInsights = buildOperatorPatternInsights(intervention, policy);
  const { reviewMode, reviewModeReason } = selectAdaptiveReviewMode(
    reviewedPlan,
    intervention,
    deltaAnalysis,
    operatorPatternInsights
  );
  const recommendation = buildRecommendationPayload(
    reviewedPlan,
    intervention,
    deltaAnalysis,
    operatorPatternInsights
  );
  const attentionPoints = buildAttentionPoints(
    reviewedPlan,
    intervention,
    deltaAnalysis,
    operatorPatternInsights
  );
  const summary = buildCompressedSummary(
    reviewMode,
    reviewModeReason,
    recommendation,
    attentionPoints,
    deltaAnalysis,
    operatorPatternInsights
  );

  return {
    reviewMode,
    reviewModeReason,
    deltaAnalysis,
    operatorPatternInsights,
    recommendation,
    attentionPoints,
    summary,
  };
}

function getLearningBounds(policy = loadControlPolicy()) {
  const strictMode = policy.strictMode || {};
  const limit = Math.min(50, Math.max(1, Number(strictMode.reviewIntelligenceLookbackLimit ?? 50) || 50));
  const days = Math.min(7, Math.max(1, Number(strictMode.reviewIntelligenceLookbackDays ?? 7) || 7));
  return {
    limit,
    windowMs: days * 24 * 60 * 60 * 1000,
  };
}

function listRecentLearningEvents(policy = loadControlPolicy()) {
  const state = loadLearningState();
  const bounds = getLearningBounds(policy);
  const now = Date.now();
  return (state.events || [])
    .filter((event) => now - toTimestamp(event.timestamp) <= bounds.windowMs)
    .sort((left, right) => toTimestamp(right.timestamp) - toTimestamp(left.timestamp))
    .slice(0, bounds.limit);
}

function classifyRiskLevel(score = 0) {
  if (score >= 70) {
    return "high";
  }
  if (score >= 35) {
    return "medium";
  }
  return "low";
}

function calculateLearningActivation(events = [], state = loadLearningState()) {
  const sessionIds = new Set(events.map((event) => event.sessionId).filter(Boolean));
  const sufficient = events.length >= 10 && sessionIds.size >= 2;
  return {
    mode: String(state.mode || "observation_only"),
    eventCount: events.length,
    sessionCount: sessionIds.size,
    sufficient,
  };
}

function detectLearningConflicts(events = []) {
  const positive = events.filter((event) => ["executed", "confirmed", "accepted"].includes(String(event.outcome || ""))).length;
  const negative = events.filter((event) => ["blocked", "failed", "dismissed"].includes(String(event.outcome || ""))).length;
  if (positive > 0 && negative > 0 && Math.abs(positive - negative) <= 1) {
    return {
      conflict: true,
      reason: "Mixed recent outcomes make calibration unstable.",
    };
  }
  return {
    conflict: false,
    reason: null,
  };
}

function detectLearningStaleness(events = []) {
  if (!events.length) {
    return {
      stale: true,
      reason: "No recent learning events are available.",
    };
  }
  const latest = events
    .map((event) => toTimestamp(event.timestamp))
    .reduce((max, value) => Math.max(max, value), 0);
  const stale = Date.now() - latest > Math.floor(getLearningBounds().windowMs / 2);
  return {
    stale,
    reason: stale ? "Recent learning evidence is getting stale." : null,
  };
}

function buildSignalQualityIndicators(events = [], recommendation, attentionPoints = []) {
  const reasonCounts = new Map();
  for (const event of events) {
    const key = String(event.reasonCode || "unknown");
    reasonCounts.set(key, Number(reasonCounts.get(key) || 0) + 1);
  }

  const fatigueSignals = [...reasonCounts.entries()]
    .filter(([, count]) => count >= 3)
    .map(([reasonCode, count]) =>
      normalizeEvidenceBackedItem({
        id: `fatigue_${reasonCode}`,
        title: `Repeated signal ${reasonCode} may be losing value.`,
        detail: `${reasonCode} appeared ${count} times in the bounded learning window.`,
        priority: "low",
        sourceType: "learning_events",
        sourceField: "reasonCode",
        reasonCode: "SIGNAL_FATIGUE",
        confidenceScore: 0.45,
        historicalBasis: { reasonCode, count },
      })
    );

  const highValueSignals = [recommendation, ...(attentionPoints || [])]
    .filter(Boolean)
    .filter((item) => item.priority === "high" && item.reasonCode !== "EVIDENCE_INCOMPLETE")
    .slice(0, 3);

  const lowValueSignals = fatigueSignals.slice(0, 3);
  const stale = detectLearningStaleness(events);
  return {
    highValueSignals,
    lowValueSignals,
    fatigueDetected: lowValueSignals.length > 0,
    ...(stale.stale
      ? {
          markers: ["learning_stale"],
          staleReason: stale.reason,
        }
      : {}),
  };
}

function buildOperatorPreferenceInsights(events = []) {
  const positive = events.filter((event) => ["executed", "confirmed", "accepted"].includes(String(event.outcome || "")));
  if (!positive.length) {
    return {
      status: "degraded",
      summary: "Operator preference insights remain observational because positive outcome evidence is limited.",
      sourceType: "learning_events",
      sourceField: "outcome",
      reasonCode: "GAP_MISSING_EVIDENCE",
      confidenceScore: 0.35,
      displayPreference: "balanced",
      orderingPreference: "risk_first",
    };
  }

  const averageAttention = positive.reduce((sum, event) => sum + Number((event.attentionSignals || []).length || 0), 0) / positive.length;
  const displayPreference = averageAttention <= 1 ? "compressed" : averageAttention >= 3 ? "expanded" : "balanced";
  return {
    status: "available",
    summary: `Recent positive outcomes correlate with a ${displayPreference} review presentation style.`,
    sourceType: "learning_events",
    sourceField: "attentionSignals",
    reasonCode: "PRESENTATION_CORRELATION",
    confidenceScore: 0.6,
    displayPreference,
    orderingPreference: "risk_first",
  };
}

function buildLearningConfidence(events = [], activation = null, markers = []) {
  const activationState = activation || calculateLearningActivation(events);
  if (!activationState.sufficient) {
    return {
      score: 0.25,
      label: "low",
      markers: [...new Set(["learning_insufficient_data", ...markers])],
    };
  }
  const stale = detectLearningStaleness(events);
  if (stale.stale) {
    return {
      score: 0.4,
      label: "low",
      markers: [...new Set(["learning_stale", ...markers])],
    };
  }
  return {
    score: 0.65,
    label: "medium",
    markers: [...new Set(markers)],
  };
}

function buildLearningCalibration(reviewedPlan, adaptiveReview, policy = loadControlPolicy()) {
  const state = loadLearningState();
  const events = listRecentLearningEvents(policy);
  const activation = calculateLearningActivation(events, state);
  const conflicts = detectLearningConflicts(events);
  const stale = detectLearningStaleness(events);
  const markers = [];
  let mode = activation.sufficient ? state.mode : "observation_only";

  if (!activation.sufficient) {
    markers.push("learning_insufficient_data", "observation_only");
  }
  if (conflicts.conflict) {
    markers.push("learning_conflict", "learning_unstable");
  }
  if (stale.stale) {
    markers.push("learning_stale");
  }
  if (mode === "disabled") {
    markers.push("disabled");
  }
  if (mode === "advisory_applied" && (conflicts.conflict || stale.stale)) {
    mode = "observation_only";
  }

  const signalQualityIndicators = buildSignalQualityIndicators(
    events,
    adaptiveReview.recommendation,
    adaptiveReview.attentionPoints
  );
  const operatorPreferenceInsights = buildOperatorPreferenceInsights(events);
  const learningConfidence = buildLearningConfidence(events, activation, markers);

  let recommendationCalibration = {
    applied: false,
    mode,
    confidenceDelta: 0,
    rankingDelta: 0,
    phrasing: "unchanged",
    reasonCode: activation.sufficient ? "CALIBRATION_FROZEN" : "learning_insufficient_data",
    sourceType: "learning_events",
    sourceField: "events",
    confidenceScore: learningConfidence.score,
  };

  let learningAdjustments = {
    mode,
    markers: [...new Set(markers)],
    adjustments: [],
    rollbackAvailable: true,
  };

  if (mode !== "disabled" && activation.sufficient && !conflicts.conflict && !stale.stale) {
    mode = state.mode === "advisory_applied" ? "advisory_applied" : "observation_only";
    if (mode === "advisory_applied") {
      const positive = events.filter((event) => ["executed", "confirmed", "accepted"].includes(String(event.outcome || ""))).length;
      const negative = events.filter((event) => ["blocked", "failed", "dismissed"].includes(String(event.outcome || ""))).length;
      const confidenceDelta = positive > negative ? 0.1 : negative > positive ? -0.1 : 0;
      const rankingDelta = signalQualityIndicators.highValueSignals.length > signalQualityIndicators.lowValueSignals.length ? 1 : 0;
      recommendationCalibration = {
        applied: confidenceDelta !== 0 || rankingDelta !== 0,
        mode,
        confidenceDelta,
        rankingDelta,
        phrasing: operatorPreferenceInsights.displayPreference === "compressed" ? "compressed" : "unchanged",
        reasonCode: "advisory_applied",
        sourceType: "learning_events",
        sourceField: "outcome",
        confidenceScore: Math.max(0, Math.min(1, learningConfidence.score)),
      };
      learningAdjustments = {
        mode,
        markers: [...new Set(["advisory_applied", ...markers])],
        adjustments: [
          ...(confidenceDelta !== 0 ? [{ type: "confidence", delta: confidenceDelta }] : []),
          ...(rankingDelta !== 0 ? [{ type: "ranking", delta: rankingDelta }] : []),
          ...(operatorPreferenceInsights.displayPreference === "compressed"
            ? [{ type: "phrasing", value: "compressed" }]
            : []),
        ],
        rollbackAvailable: true,
      };
    }
  }

  if (mode !== "advisory_applied" && !markers.includes("observation_only") && mode !== "disabled") {
    learningAdjustments.markers = [...new Set(["observation_only", ...learningAdjustments.markers])];
  }

  return {
    learningSignals: {
      mode,
      markers: [...new Set(mode === "advisory_applied" ? ["advisory_applied", ...markers] : ["observation_only", ...markers])],
      eventCount: activation.eventCount,
      sessionCount: activation.sessionCount,
      sourceType: "learning_events",
      sourceField: "events",
      reasonCode: activation.sufficient ? (mode === "advisory_applied" ? "advisory_applied" : "observation_only") : "learning_insufficient_data",
      confidenceScore: learningConfidence.score,
    },
    recommendationCalibration,
    signalQualityIndicators,
    operatorPreferenceInsights,
    learningAdjustments,
    learningConfidence,
  };
}

function applyLearningToAdaptiveReview(adaptiveReview, learningLayer) {
  const recommendation = {
    ...adaptiveReview.recommendation,
    confidenceScore: Math.max(
      0,
      Math.min(
        1,
        Number(adaptiveReview.recommendation?.confidenceScore ?? 0.5) +
          Number(learningLayer.recommendationCalibration.confidenceDelta || 0)
      )
    ),
  };

  const attentionPoints = [...(adaptiveReview.attentionPoints || [])];
  if (learningLayer.recommendationCalibration.rankingDelta > 0 && attentionPoints.length > 1) {
    attentionPoints.sort((left, right) => {
      const leftPriority = left.priority === "high" ? 3 : left.priority === "medium" ? 2 : 1;
      const rightPriority = right.priority === "high" ? 3 : right.priority === "medium" ? 2 : 1;
      return rightPriority - leftPriority;
    });
  }

  const summary = {
    ...adaptiveReview.summary,
    bullets:
      learningLayer.operatorPreferenceInsights.displayPreference === "compressed"
        ? (adaptiveReview.summary?.bullets || []).slice(0, 2)
        : adaptiveReview.summary?.bullets || [],
  };

  return {
    ...adaptiveReview,
    recommendation,
    attentionPoints,
    summary,
    ...learningLayer,
  };
}

function recordLearningEvent(event = {}) {
  return persistLearningEvent(event);
}

function setLearningApplicationMode(mode, actor = {}, reason = "") {
  const next = persistLearningMode(mode, actor, reason);
  appendAuditEvent({
    type: "learning_mode_update",
    eventType: "learning_mode_update",
    actor: "operator",
    message: `Learning mode changed to ${next.mode}.`,
    payload: {
      mode: next.mode,
      reason,
      rollback: next.rollback,
    },
  });
  return next;
}

function rollbackLearningLayer(actor = {}, reason = "") {
  const next = resetPersistedLearningState(actor, reason);
  appendAuditEvent({
    type: "learning_reset",
    eventType: "learning_reset",
    actor: "operator",
    message: "Learning adjustments were reset to defaults.",
    payload: {
      reason,
      rollback: next.rollback,
    },
  });
  return next;
}

function buildDecisionFromIntervention(candidatePlan, intervention) {
  const strongest = (intervention.findings || []).find((finding) => finding.severity === "critical")
    || (intervention.findings || [])[0]
    || (intervention.hypotheses || [])[0];
  const scoringReason = candidatePlan?.scoring?.reason;
  const scoringExplanation = candidatePlan?.scoring?.explanation;
  const preservesAssignedMode = intervention.finalMode === candidatePlan?.proposedMode;
  let reason = scoringReason || strongest?.reason || intervention.recommendedAction;
  let explanation = intervention.summary;

  if (
    intervention.recommendedAction !== "approve" &&
    candidatePlan?.proposedMode !== "blocked" &&
    !preservesAssignedMode &&
    strongest?.reason
  ) {
    reason = strongest.reason;
  }

  if (preservesAssignedMode && scoringExplanation) {
    explanation = scoringExplanation;
  }

  return {
    reason,
    explanation,
    riskScore: candidatePlan.scoring.scores.riskScore,
    confidenceScore: candidatePlan.scoring.scores.confidenceScore,
    valueScore: candidatePlan.scoring.scores.valueScore,
    reversibilityScore: candidatePlan.scoring.scores.reversibilityScore,
    decision: intervention.finalMode,
    reviewStatus: intervention.reviewStatus,
    recommendedAction: intervention.recommendedAction,
    findings: intervention.findings,
    hypotheses: intervention.hypotheses,
    reviewMode: intervention.reviewMode,
    reviewModeReason: intervention.reviewModeReason,
    recommendation: intervention.recommendation,
    attentionPoints: intervention.attentionPoints,
    summary: intervention.summary,
    learningSignals: intervention.learningSignals,
    recommendationCalibration: intervention.recommendationCalibration,
    signalQualityIndicators: intervention.signalQualityIndicators,
    operatorPreferenceInsights: intervention.operatorPreferenceInsights,
    learningAdjustments: intervention.learningAdjustments,
    learningConfidence: intervention.learningConfidence,
  };
}

function buildReviewedPlan(candidatePlan, intervention) {
  return {
    ...candidatePlan,
    ...intervention,
    steps: intervention.steps || candidatePlan.steps,
    reviewStatus: intervention.reviewStatus,
    finalMode: intervention.finalMode,
    planCompleteness:
      intervention.deferredItems && intervention.deferredItems.length > 0
        ? "partial"
        : candidatePlan.planCompleteness,
    currentStageExecutable: Boolean(intervention.currentStageExecutable),
  };
}

function validateRetroactivePhaseConsistency(candidatePlan, intervention, reviewedPlan, decision) {
  if (reviewedPlan.reviewStatus === "blocked" && decision.decision !== "blocked") {
    throw new Error("PHASE_RETROACTIVE_CONFLICT");
  }
  if (
    reviewedPlan.planCompleteness === "partial" &&
    (!Array.isArray(reviewedPlan.deferredItems) || reviewedPlan.deferredItems.length === 0)
  ) {
    throw new Error("PHASE_RETROACTIVE_CONFLICT");
  }
  if (
    candidatePlan.planQuality === "synthetic" &&
    intervention.reviewStatus === "approved" &&
    decision.decision === "auto_execute" &&
    decision.reason === "low_risk_auto_execute"
  ) {
    throw new Error("PHASE_RETROACTIVE_CONFLICT");
  }
}

function analyzePlan(plan, context = {}, policy = loadControlPolicy(), options = {}) {
  const candidatePlan = normalizeCandidatePlan(plan, context, policy, options);
  const reviewResult = runPlanReviewer(candidatePlan, context, policy);
  const secondThoughtResult = runSecondThought(candidatePlan, reviewResult);
  const interventionResult = runInterventionEngine(candidatePlan, reviewResult, secondThoughtResult, context, policy);
  const reviewedPlan = buildReviewedPlan(candidatePlan, interventionResult);
  const adaptiveReview = buildAdaptiveReviewPayload(reviewedPlan, interventionResult, policy);
  let learningLayer;
  try {
    learningLayer = computeGovernedLearningLayer(reviewedPlan, adaptiveReview, policy);
  } catch (error) {
    appendAuditEvent({
      type: "learning",
      eventType: "learning.error",
      actor: "system",
      message: "Governed learning advisory failed; falling back to disabled learning.",
      payload: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    learningLayer = {
      learningSignals: {
        mode: "disabled",
        markers: ["disabled"],
        eventCount: 0,
        sessionCount: 0,
        sourceType: "learning_events",
        sourceField: "events",
        reasonCode: "INSUFFICIENT_EVIDENCE",
        confidenceScore: 0,
      },
      recommendationCalibration: {
        applied: false,
        mode: "disabled",
        confidenceDelta: 0,
        rankingDelta: 0,
        phrasing: "unchanged",
        reasonCode: "INSUFFICIENT_EVIDENCE",
        sourceType: "learning_events",
        sourceField: "events",
        confidenceScore: 0,
      },
      signalQualityIndicators: {
        highValueSignals: [],
        lowValueSignals: [],
        fatigueDetected: false,
      },
      operatorPreferenceInsights: {
        status: "degraded",
        summary: "Learning advisory unavailable because the governed learning layer failed.",
        sourceType: "learning_events",
        sourceField: "events",
        reasonCode: "INSUFFICIENT_EVIDENCE",
        confidenceScore: 0,
        displayPreference: "balanced",
        orderingPreference: "risk_first",
      },
      learningAdjustments: {
        mode: "disabled",
        markers: ["disabled"],
        adjustments: [],
        rollbackAvailable: true,
      },
      learningConfidence: {
        score: 0,
        label: "low",
        markers: ["disabled"],
      },
      learningAdvisory: {
        available: false,
        confidenceScore: 0,
        hints: [],
        shadowSignals: [],
        generatedAt: new Date().toISOString(),
        dataGrounded: false,
      },
    };
  }
  const learnedReview = applyGovernedLearningToAdaptiveReview(adaptiveReview, learningLayer);
  const enrichedReview = {
    ...interventionResult,
    ...learnedReview,
  };
  const enrichedReviewedPlan = {
    ...reviewedPlan,
    ...learnedReview,
  };
  const decision = buildDecisionFromIntervention(candidatePlan, enrichedReview);
  validateRetroactivePhaseConsistency(candidatePlan, enrichedReview, enrichedReviewedPlan, decision);

  return {
    candidatePlan,
    review: enrichedReview,
    reviewedPlan: enrichedReviewedPlan,
    decision,
  };
}

function reviewPlan(plan, context = {}, policy = loadControlPolicy()) {
  return analyzePlan(plan, context, policy).decision;
}

async function reviewRequest(request = {}, actor = {}, options = {}) {
  const policy = loadControlPolicy();
  const context = buildContext({
    actor,
    modes: options.modes || {},
    workspaceId: options.workspaceId,
    sessionState: options.sessionState,
    recentTasks: options.recentTasks,
    options,
  });
  const plan = buildSyntheticPlan(request);
  const analysis = analyzePlan(plan, context, policy, {
    originalRequest: String(request.command || request.action || plan?.originalRequest || "").trim(),
    planQuality: options.planQuality || (request.plan ? undefined : "synthetic"),
  });

  return {
    context,
    candidatePlan: analysis.candidatePlan,
    review: analysis.review,
    plan: analysis.reviewedPlan,
    decision: analysis.decision,
  };
}

function validateReviewedPlanForRouting(plan = null) {
  if (!plan || typeof plan !== "object") {
    return { ok: false, error: "Routing blocked because the plan is missing." };
  }
  if (!plan.reviewStatus || !ALL_REVIEW_STATUSES.has(plan.reviewStatus)) {
    return { ok: false, error: "Routing blocked because the plan is missing a valid reviewStatus." };
  }
  if (plan.reviewStatus === "pending" || plan.reviewStatus === "blocked") {
    return { ok: false, error: `Routing blocked because reviewStatus is ${plan.reviewStatus}.` };
  }
  if (plan.currentStageExecutable === false) {
    return { ok: false, error: "Routing blocked because the reviewed plan is not executable in the current stage." };
  }
  return { ok: true };
}

function isFinalReviewedPlan(plan = null) {
  return validateReviewedPlanForRouting(plan).ok === true;
}

async function executeControlledPlan(input, { actor = {}, memory = null, modes = {}, identitySource = "human" } = {}) {
  const policy = loadControlPolicy();
  let plannerMemory = memory;
  try {
    const learningAdvisory = buildLearningAdvisory(policy);
    plannerMemory = {
      ...(memory && typeof memory === "object" ? memory : {}),
      learningAdvisory,
    };
  } catch (error) {
    appendAuditEvent({
      type: "learning",
      eventType: "learning.error",
      actor: "system",
      message: "Learning advisory generation failed before planner invocation.",
      payload: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
  const candidatePlan = await createPlan(input, plannerMemory, modes);
  const context = buildContext({
    actor,
    modes,
    workspaceId: actor.workspaceId || null,
    options: { identitySource },
  });
  const analysis = analyzePlan(candidatePlan, context, policy, {
    originalRequest: String(input || candidatePlan.originalRequest || "").trim(),
    planQuality: "planner_validated",
  });

  if (analysis.decision.decision !== "auto_execute") {
    return {
      ok: analysis.decision.decision === "simulate",
      candidatePlan: analysis.candidatePlan,
      plan: analysis.reviewedPlan,
      review: analysis.review,
      control: {
        context,
        decision: analysis.decision,
      },
    };
  }

  const executionEngine = require("./executionEngine");
  const executionResult = await executionEngine.execute(analysis.reviewedPlan, {
    ...modes,
    executionMode: "auto_execute",
    controlApproved: true,
    controlDecision: analysis.decision,
    systemTimeoutSeconds: resolveSystemTimeoutSeconds(policy).seconds,
  });

  if (executionResult && executionResult.ok === false && executionResult.finalResult == null) {
    return {
      ok: false,
      error: executionResult.error || "Execution failed.",
      candidatePlan: analysis.candidatePlan,
      plan: analysis.reviewedPlan,
      result: executionResult.finalResult ?? null,
      execution: executionResult,
      review: analysis.review,
      control: {
        context,
        decision: analysis.decision,
      },
    };
  }

  return {
    ok: true,
    candidatePlan: analysis.candidatePlan,
    plan: analysis.reviewedPlan,
    result: executionResult?.finalResult ?? executionResult,
    execution: executionResult,
    review: analysis.review,
    control: {
      context,
      decision: analysis.decision,
    },
  };
}

async function executeControlledStructuredPlan(plan, { actor = {}, modes = {}, identitySource = "human" } = {}) {
  const policy = loadControlPolicy();
  const context = buildContext({
    actor,
    modes,
    workspaceId: actor.workspaceId || null,
    options: { identitySource },
  });
  const analysis = analyzePlan(plan, context, policy, {
    originalRequest: String(plan?.originalRequest || "").trim(),
    planQuality: "structured_native",
  });

  if (analysis.decision.decision !== "auto_execute") {
    return {
      ok: analysis.decision.decision === "simulate",
      candidatePlan: analysis.candidatePlan,
      plan: analysis.reviewedPlan,
      review: analysis.review,
      control: {
        context,
        decision: analysis.decision,
      },
    };
  }

  const executionEngine = require("./executionEngine");
  const executionResult = await executionEngine.execute(analysis.reviewedPlan, {
    ...modes,
    executionMode: "auto_execute",
    controlApproved: true,
    controlDecision: analysis.decision,
    systemTimeoutSeconds: resolveSystemTimeoutSeconds(policy).seconds,
  });

  if (executionResult && executionResult.ok === false && executionResult.finalResult == null) {
    return {
      ok: false,
      error: executionResult.error || "Execution failed.",
      candidatePlan: analysis.candidatePlan,
      plan: analysis.reviewedPlan,
      result: executionResult.finalResult ?? null,
      execution: executionResult,
      review: analysis.review,
      control: {
        context,
        decision: analysis.decision,
      },
    };
  }

  return {
    ok: true,
    candidatePlan: analysis.candidatePlan,
    plan: analysis.reviewedPlan,
    result: executionResult?.finalResult ?? executionResult,
    execution: executionResult,
    review: analysis.review,
    control: {
      context,
      decision: analysis.decision,
    },
  };
}

module.exports = {
  loadControlPolicy,
  discoverRuntimeFoundation,
  resolveSystemTimeoutSeconds,
  normalizeMode,
  pickSaferMode,
  modeAllows,
  isExecutionAuthorized,
  resolveIdentity,
  buildContext,
  classifyStep,
  normalizeCandidatePlan,
  validatePlannerFeedback,
  runPlanReviewer,
  runSecondThought,
  runInterventionEngine,
  analyzePlan,
  reviewPlan,
  reviewRequest,
  recordLearningEvent,
  setLearningApplicationMode,
  rollbackLearningLayer,
  validateReviewedPlanForRouting,
  isFinalReviewedPlan,
  executeControlledPlan,
  executeControlledStructuredPlan,
};
