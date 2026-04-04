function normalizeRole(role, fallback = "operator") {
  return ["viewer", "operator", "approver", "admin"].includes(role) ? role : fallback;
}

function roleRank(role) {
  switch (normalizeRole(role)) {
    case "viewer":
      return 0;
    case "operator":
      return 1;
    case "approver":
      return 2;
    case "admin":
      return 3;
    default:
      return 1;
  }
}

function hasAtLeastRole(role, minimumRole) {
  return roleRank(role) >= roleRank(minimumRole);
}

function canApprove(role) {
  return hasAtLeastRole(role, "approver");
}

function canManageGovernance(role) {
  return hasAtLeastRole(role, "admin");
}

function canUseConsoleAction(role, action) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "viewer") {
    return false;
  }

  if (action === "approval:approve" || action === "approval:reject") {
    return canApprove(normalizedRole);
  }

  if (
    action === "approval:reassign-target" ||
    action === "approval:take-over" ||
    action === "approval:bulk-reassign-target" ||
    action === "approval:bulk-take-over"
  ) {
    return canManageGovernance(normalizedRole);
  }

  if (action === "collaboration:update-governance") {
    return canManageGovernance(normalizedRole);
  }

  if (action === "collaboration:apply-approval-policy-recommendation") {
    return canManageGovernance(normalizedRole);
  }

  if (action === "collaboration:promote-approval-policy-recommendation") {
    return canManageGovernance(normalizedRole);
  }

  if (action === "collaboration:rollback-approval-policy") {
    return canManageGovernance(normalizedRole);
  }

  if (
    action === "collaboration:acknowledge-trust-alert" ||
    action === "collaboration:restart-approval-recommendation-observation" ||
    action === "collaboration:extend-approval-recommendation-cooldown"
  ) {
    return canManageGovernance(normalizedRole);
  }

  if (
    action === "collaboration:automation-assign" ||
    action === "collaboration:automation-bulk-assign" ||
    action === "collaboration:automation-assign-approver" ||
    action === "collaboration:automation-bulk-assign-approver" ||
    action === "collaboration:automation-assign-backup-approver" ||
    action === "collaboration:automation-bulk-assign-backup-approver" ||
    action === "collaboration:automation-bulk-apply-policy-override" ||
    action === "collaboration:automation-bulk-reset-policy-override" ||
    action === "collaboration:save-policy-playbook" ||
    action === "collaboration:delete-policy-playbook" ||
    action === "collaboration:automation-bulk-apply-policy-playbook" ||
    action === "collaboration:automation-bulk-stabilize" ||
    action === "collaboration:automation-bulk-run-sweep" ||
    action === "collaboration:automation-bulk-create-followup" ||
    action === "collaboration:automation-bulk-snooze" ||
    action === "collaboration:automation-snooze" ||
    action === "collaboration:automation-run-sweep" ||
    action === "collaboration:automation-create-followup" ||
    action === "collaboration:automation-add-note" ||
    action === "collaboration:automation-generate-summary" ||
    action === "collaboration:automation-set-status" ||
    action === "collaboration:automation-share-summary" ||
    action === "collaboration:automation-checklist-toggle"
  ) {
    return canManageGovernance(normalizedRole);
  }

  return true;
}

function getEnvironmentPolicy(governance = {}, workspaceId = null) {
  const workspaceKey = workspaceId ? String(workspaceId) : null;
  const workspaceOverride =
    workspaceKey && governance.workspacePolicyOverrides && typeof governance.workspacePolicyOverrides === "object"
      ? governance.workspacePolicyOverrides[workspaceKey] || {}
      : {};
  const currentEnvironment = workspaceOverride.environment || governance.currentEnvironment || "development";
  const fallbackPolicies = {
    development: {
      minimumRoleForCommands: "operator",
      minimumRoleForApprovals: "approver",
      minimumRoleForGovernance: "admin",
      requireChecklistForResolved: false,
      requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
      requireSummaryShareBeforeArchived: false,
      requireApprovalForResolved: false,
      requireApprovalForArchived: false,
      incidentApprovalReminderMinutes: 30,
      incidentApprovalEscalationMinutes: 60,
      incidentApprovalEscalationTarget: "team",
      incidentApprovalFinalEscalationMinutes: 120,
      incidentApprovalFinalEscalationTarget: "role:admin",
      incidentApprovalCapacityLimit: 3,
      autoPromoteApprovalRecommendations: false,
      autoPromoteRecommendationConfidence: 0.9,
      autoPromoteObservationHours: 24,
      autoPromoteCooldownHours: 72,
      trustDropAction: "notify",
      trustDropFollowupOwner: "Jamie Lead",
      promoteTrustDropToIncident: false,
    },
    staging: {
      minimumRoleForCommands: "operator",
      minimumRoleForApprovals: "approver",
      minimumRoleForGovernance: "admin",
      requireChecklistForResolved: true,
      requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated"],
      requireSummaryShareBeforeArchived: true,
      requireApprovalForResolved: false,
      requireApprovalForArchived: false,
      incidentApprovalReminderMinutes: 10,
      incidentApprovalEscalationMinutes: 20,
      incidentApprovalEscalationTarget: "role:admin",
      incidentApprovalFinalEscalationMinutes: 40,
      incidentApprovalFinalEscalationTarget: "team",
      incidentApprovalCapacityLimit: 2,
      autoPromoteApprovalRecommendations: false,
      autoPromoteRecommendationConfidence: 0.88,
      autoPromoteObservationHours: 24,
      autoPromoteCooldownHours: 72,
      trustDropAction: "digest",
      trustDropFollowupOwner: "Jamie Lead",
      promoteTrustDropToIncident: false,
    },
    production: {
      minimumRoleForCommands: "approver",
      minimumRoleForApprovals: "approver",
      minimumRoleForGovernance: "admin",
      requireChecklistForResolved: true,
      requiredChecklistForResolved: ["owner_assigned", "followup_created", "summary_generated", "shared_handoff"],
      requireSummaryShareBeforeArchived: true,
      requireApprovalForResolved: true,
      requireApprovalForArchived: true,
      incidentApprovalReminderMinutes: 5,
      incidentApprovalEscalationMinutes: 15,
      incidentApprovalEscalationTarget: "role:admin",
      incidentApprovalFinalEscalationMinutes: 30,
      incidentApprovalFinalEscalationTarget: "team",
      incidentApprovalCapacityLimit: 1,
      autoPromoteApprovalRecommendations: false,
      autoPromoteRecommendationConfidence: 0.92,
      autoPromoteObservationHours: 48,
      autoPromoteCooldownHours: 120,
      trustDropAction: "followup",
      trustDropFollowupOwner: "Jamie Lead",
      promoteTrustDropToIncident: true,
    },
  };

  return {
    currentEnvironment,
    ...fallbackPolicies[currentEnvironment],
    ...(governance.environmentPolicies?.[currentEnvironment] || {}),
    ...workspaceOverride,
  };
}

function canExecuteCommands(role, governance = {}, workspaceId = null) {
  const policy = getEnvironmentPolicy(governance, workspaceId);
  return hasAtLeastRole(role, policy.minimumRoleForCommands || "operator");
}

function canApproveInEnvironment(role, governance = {}, workspaceId = null) {
  const policy = getEnvironmentPolicy(governance, workspaceId);
  return hasAtLeastRole(role, policy.minimumRoleForApprovals || "approver");
}

function canManageGovernanceInEnvironment(role, governance = {}) {
  const policy = getEnvironmentPolicy(governance);
  return hasAtLeastRole(role, policy.minimumRoleForGovernance || "admin");
}

function requiresIncidentApproval(incidentStatus, governance = {}, workspaceId = null) {
  const policy = getEnvironmentPolicy(governance, workspaceId);
  const normalizedStatus = String(incidentStatus || "").trim().toLowerCase();
  if (normalizedStatus === "resolved") {
    return Boolean(policy.requireApprovalForResolved);
  }
  if (normalizedStatus === "archived") {
    return Boolean(policy.requireApprovalForArchived);
  }
  return false;
}

module.exports = {
  normalizeRole,
  hasAtLeastRole,
  canApprove,
  canManageGovernance,
  canUseConsoleAction,
  getEnvironmentPolicy,
  requiresIncidentApproval,
  canExecuteCommands,
  canApproveInEnvironment,
  canManageGovernanceInEnvironment,
};
