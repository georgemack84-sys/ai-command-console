const CURRENT_RUNTIME_POLICY_VERSION = 33;

function mergeMissing(target, additions) {
  return {
    ...(target || {}),
    ...Object.fromEntries(Object.entries(additions).filter(([key]) => !(key in (target || {})))),
  };
}

const LEGACY_CONSOLE_ACTIONS = {
  "legacy-console:shell_read": "shell_read",
  "legacy-console:file_read": "file_read",
  "legacy-console:process_control": "process_control",
  "legacy-console:agent_control": "agent_control",
  "legacy-console:workflow_control": "workflow_control",
  "legacy-console:network_mutation": "network_mutation",
  "legacy-console:plugin_action": "plugin_action",
  "legacy-console:shell_mutation": "shell_mutation",
  "legacy-console:file_write": "file_write",
  "legacy-console:credential_access": "credential_access",
};

const LEGACY_CONSOLE_PREFIXES = {
  "legacy-console:shell_read:": "shell_read",
  "legacy-console:file_read:": "file_read",
  "legacy-console:process_control:": "process_control",
  "legacy-console:agent_control:": "agent_control",
  "legacy-console:workflow_control:": "workflow_control",
  "legacy-console:network_mutation:": "network_mutation",
  "legacy-console:plugin_action:": "plugin_action",
  "legacy-console:shell_mutation:": "shell_mutation",
  "legacy-console:file_write:": "file_write",
  "legacy-console:credential_access:": "credential_access",
};

function applyRuntimePolicyMigrations(loadedPolicy = {}, { normalizeStrictModeConfig }) {
  const policy = { ...(loadedPolicy || {}) };
  const version = () => Number(policy.version || 1);
  const migrate = (targetVersion, apply) => {
    if (version() < targetVersion) {
      apply();
      policy.version = targetVersion;
    }
  };

  migrate(2, () => {
    if (policy.actionCategoryMap?.list_plugins === "plugin_action") {
      policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), list_plugins: "shell_read" };
    }
  });
  migrate(3, () => {
    policy.actionCategoryMap = mergeMissing(policy.actionCategoryMap, {
      dashboard_system: "shell_read", dashboard_health: "shell_read", dashboard_workload: "shell_read",
      queue_list: "shell_read", queue_next: "shell_read", alerts_list: "shell_read", alerts_active: "shell_read",
    });
  });
  migrate(4, () => {
    policy.actionCategoryMap = mergeMissing(policy.actionCategoryMap, {
      agents_list: "shell_read", agent_status: "shell_read", schedule_list: "shell_read",
      schedule_status: "shell_read", watcher_status: "shell_read",
    });
  });
  migrate(5, () => {
    policy.actionCategoryMap = mergeMissing(policy.actionCategoryMap, {
      schedule_run: "process_control", watcher_run: "process_control", alerts_run: "process_control",
    });
  });
  migrate(6, () => {
    policy.actionCategoryMap = mergeMissing(policy.actionCategoryMap, {
      agent_start: "process_control", agent_tick: "process_control", agent_stop: "process_control",
      agent_pause: "process_control", agent_resume: "process_control", agent_restart: "process_control",
    });
  });
  migrate(7, () => {
    policy.categoryActionClassMap = mergeMissing(policy.categoryActionClassMap, { agent_control: "process" });
    policy.categoryPolicies = mergeMissing(policy.categoryPolicies, {
      agent_control: { riskScore: 45, confidenceScore: 75, valueScore: 65, reversibilityScore: 55, maxMode: "confirm_required", safeMode: "simulate" },
    });
    policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), agent_start: "agent_control", agent_tick: "agent_control", agent_stop: "agent_control", agent_pause: "agent_control", agent_resume: "agent_control", agent_restart: "agent_control" };
    policy.actionPrefixCategoryMap = { ...(policy.actionPrefixCategoryMap || {}), "agent:": "agent_control" };
    policy.commandPrefixCategoryMap = { ...(policy.commandPrefixCategoryMap || {}), "agent:start ": "agent_control", "agent:tick ": "agent_control", "agent:stop ": "agent_control", "agent:pause ": "agent_control", "agent:resume ": "agent_control", "agent:restart ": "agent_control" };
  });
  migrate(8, () => {
    policy.categoryActionClassMap = mergeMissing(policy.categoryActionClassMap, { workflow_control: "process" });
    policy.categoryPolicies = mergeMissing(policy.categoryPolicies, {
      workflow_control: { riskScore: 45, confidenceScore: 80, valueScore: 65, reversibilityScore: 55, maxMode: "confirm_required", safeMode: "simulate" },
    });
    policy.actionCategoryMap = mergeMissing(policy.actionCategoryMap, { dashboard_agent: "shell_read", review_list: "shell_read", manager_route: "workflow_control", review_create: "workflow_control" });
    policy.actionPrefixCategoryMap = mergeMissing(policy.actionPrefixCategoryMap, { "manager:": "workflow_control", "review:": "workflow_control" });
    policy.commandCategoryMap = mergeMissing(policy.commandCategoryMap, { "review:list": "shell_read" });
    policy.commandPrefixCategoryMap = mergeMissing(policy.commandPrefixCategoryMap, { "dashboard:agent ": "shell_read", "manager:route ": "workflow_control", "review:create ": "workflow_control" });
  });
  migrate(9, () => {
    policy.actionCategoryMap = mergeMissing(policy.actionCategoryMap, { digest_health: "shell_read" });
    policy.commandCategoryMap = mergeMissing(policy.commandCategoryMap, { "digest:health": "shell_read" });
    policy.commandPrefixCategoryMap = mergeMissing(policy.commandPrefixCategoryMap, { "digest:health": "shell_read" });
  });
  migrate(10, () => { policy.actionCategoryMap = mergeMissing(policy.actionCategoryMap, { ownership_signals: "shell_read" }); });
  migrate(11, () => {
    policy.actionCategoryMap = mergeMissing(policy.actionCategoryMap, { brief_list: "shell_read", report_list: "shell_read", brief_create: "workflow_control", brief_route: "workflow_control", report_create: "workflow_control", report_publish: "workflow_control" });
    policy.commandCategoryMap = mergeMissing(policy.commandCategoryMap, { "brief:list": "shell_read", "report:list": "shell_read" });
    policy.commandPrefixCategoryMap = mergeMissing(policy.commandPrefixCategoryMap, { "brief:create ": "workflow_control", "brief:route ": "workflow_control", "report:create ": "workflow_control", "report:publish ": "workflow_control" });
  });
  migrate(12, () => { policy.actionCategoryMap = mergeMissing(policy.actionCategoryMap, { workflow_route_task: "workflow_control", job_detail: "shell_read", "workflow:route-task": "workflow_control", "job:detail": "shell_read" }); });
  migrate(13, () => { policy.actionCategoryMap = mergeMissing(policy.actionCategoryMap, { "workflow:create-task": "workflow_control" }); });
  migrate(14, () => { policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), "workflow:create-task": "workflow_control", "job:detail": "shell_read" }; });
  migrate(15, () => {
    policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), "job:cancel": "workflow_control", "job:retry": "workflow_control" };
    policy.actionPrefixCategoryMap = { ...(policy.actionPrefixCategoryMap || {}), "watcher:": "workflow_control", "alert:": "workflow_control" };
  });
  migrate(16, () => { policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), "job:cancel": "workflow_control", "job:retry": "workflow_control", "watcher:start": "workflow_control", "watcher:stop": "workflow_control", "watcher:rule-upsert": "workflow_control", "watcher:rule-delete": "workflow_control", "alert:acknowledge": "workflow_control", "alert:resolve": "workflow_control", "alert:note": "workflow_control", "alert:run-checks": "workflow_control" }; });
  migrate(17, () => { policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), "policy:update-thresholds": "workflow_control", "policy:update-automation": "workflow_control", "agent:update-config": "agent_control", "review:approve": "workflow_control", "review:revise": "workflow_control", "review:followup": "workflow_control" }; });
  migrate(18, () => { policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), "collaboration:update-governance": "workflow_control", "collaboration:apply-approval-policy-recommendation": "workflow_control", "collaboration:promote-approval-policy-recommendation": "workflow_control", "collaboration:acknowledge-trust-alert": "workflow_control", "collaboration:restart-approval-recommendation-observation": "workflow_control", "collaboration:extend-approval-recommendation-cooldown": "workflow_control" }; });
  migrate(19, () => { policy.strictMode = normalizeStrictModeConfig(policy.strictMode); });
  migrate(20, () => {
    policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), agent_pause: "agent_control", agent_resume: "agent_control", agent_restart: "agent_control" };
    policy.commandPrefixCategoryMap = { ...(policy.commandPrefixCategoryMap || {}), "agent:pause ": "agent_control", "agent:resume ": "agent_control", "agent:restart ": "agent_control" };
  });
  migrate(21, () => { policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), "automation-template:preflight": "shell_read", "automation-template:save": "workflow_control", "automation-template:delete": "workflow_control", "automation-template:run": "workflow_control" }; });
  migrate(22, () => { policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), "collaboration:assign-session": "workflow_control", "collaboration:archive-session": "workflow_control", "collaboration:save-shared-macro": "process_control", "collaboration:archive-shared-macro": "workflow_control" }; });
  migrate(23, () => { policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), "collaboration:add-handoff-note": "process_control", "collaboration:delegate-handoff": "workflow_control", "collaboration:close-handoff": "workflow_control" }; });
  migrate(24, () => { policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), "ownership:claim-item": "process_control", "ownership:release-item": "workflow_control", "ownership:assign-item": "workflow_control" }; });
  migrate(25, () => { policy.actionPrefixCategoryMap = { ...(policy.actionPrefixCategoryMap || {}), ...LEGACY_CONSOLE_PREFIXES, "research:": "workflow_control" }; });
  migrate(26, () => { policy.actionPrefixCategoryMap = { ...(policy.actionPrefixCategoryMap || {}), "dashboard:": "workflow_control" }; });
  migrate(27, () => { policy.actionPrefixCategoryMap = { ...(policy.actionPrefixCategoryMap || {}), "admin:": "workflow_control" }; });
  migrate(28, () => { policy.actionPrefixCategoryMap = { ...(policy.actionPrefixCategoryMap || {}), "jobs:": "process_control" }; });
  migrate(30, () => {
    policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), agent_pause: "agent_control", agent_resume: "agent_control", agent_restart: "agent_control", "automation-template:preflight": "shell_read", "automation-template:save": "workflow_control", "automation-template:delete": "workflow_control", "automation-template:run": "workflow_control", "collaboration:assign-session": "workflow_control", "collaboration:archive-session": "workflow_control", "collaboration:save-shared-macro": "process_control", "collaboration:archive-shared-macro": "workflow_control", "collaboration:add-handoff-note": "process_control", "collaboration:delegate-handoff": "workflow_control", "collaboration:close-handoff": "workflow_control", "ownership:claim-item": "process_control", "ownership:release-item": "workflow_control", "ownership:assign-item": "workflow_control", ...LEGACY_CONSOLE_ACTIONS };
    policy.actionPrefixCategoryMap = { ...(policy.actionPrefixCategoryMap || {}), ...LEGACY_CONSOLE_PREFIXES, "research:": "workflow_control", "dashboard:": "workflow_control", "admin:": "workflow_control", "jobs:": "process_control" };
    policy.commandPrefixCategoryMap = { ...(policy.commandPrefixCategoryMap || {}), "agent:pause ": "agent_control", "agent:resume ": "agent_control", "agent:restart ": "agent_control" };
  });
  migrate(31, () => { policy.actionPrefixCategoryMap = { ...(policy.actionPrefixCategoryMap || {}), "agent-tasks:": "process_control" }; });
  migrate(32, () => { policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), "sources:refresh": "network_mutation" }; });
  migrate(33, () => { policy.actionCategoryMap = { ...(policy.actionCategoryMap || {}), "research:summaries-run-due": "network_mutation" }; });

  return policy;
}

module.exports = { CURRENT_RUNTIME_POLICY_VERSION, applyRuntimePolicyMigrations };
