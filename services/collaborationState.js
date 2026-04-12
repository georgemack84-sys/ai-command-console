function createDefaultCollaborationGovernance() {
  return {
    sensitiveActionsRequireApproval: true,
    currentEnvironment: "development",
    demoScenario: {
      id: "control-plane",
      name: "Control Plane Story",
      description: "Production is unhealthy, staging recovered, and labs remains noisy for stabilization demo steps.",
    },
    appliedApprovalPolicies: [],
    approvalRecommendationObservations: [],
    approvalTrustAlertAcks: [],
    approvalTrustHistory: [],
    workspacePolicyOverrides: {},
    workspacePolicyPlaybooks: [],
    workspacePolicyPlaybookRollouts: [],
    defaultPolicyPlaybookPresets: [
      {
        id: "preset-dev",
        name: "Development",
        environment: "development",
        incidentApprovalCapacityLimit: 3,
        trustDropAction: "notify",
        requireApprovalForResolved: false,
        promoteTrustDropToIncident: false,
        description: "Balanced posture for local and internal iteration.",
      },
      {
        id: "preset-prod",
        name: "Production",
        environment: "production",
        incidentApprovalCapacityLimit: 1,
        trustDropAction: "followup",
        requireApprovalForResolved: true,
        promoteTrustDropToIncident: true,
        description: "Stricter approval and escalation posture for customer-facing work.",
      },
    ],
    environmentPolicies: {
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
    },
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeEnvironmentPolicies(defaultPolicies, providedPolicies) {
  const merged = { ...defaultPolicies };
  if (!isPlainObject(providedPolicies)) {
    return merged;
  }

  Object.entries(providedPolicies).forEach(([environment, policy]) => {
    merged[environment] = {
      ...(isPlainObject(defaultPolicies?.[environment]) ? defaultPolicies[environment] : {}),
      ...(isPlainObject(policy) ? policy : {}),
    };
  });

  return merged;
}

function createDefaultCollaborationState() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    governance: createDefaultCollaborationGovernance(),
    sharedSessions: [],
    handoffs: [],
    approvals: [],
    inboxState: {},
    inboxHistory: {},
    digestPreferences: {},
    digestRuns: {},
    digestWorkspaceState: {},
  };
}

function normalizeCollaborationState(parsed = {}) {
  const defaults = createDefaultCollaborationState();
  const defaultGovernance = createDefaultCollaborationGovernance();

  return {
    ...defaults,
    ...parsed,
    governance: {
      ...defaultGovernance,
      ...(parsed.governance || {}),
      demoScenario:
        parsed.governance?.demoScenario && typeof parsed.governance.demoScenario === "object"
          ? parsed.governance.demoScenario
          : defaultGovernance.demoScenario,
      appliedApprovalPolicies: Array.isArray(parsed.governance?.appliedApprovalPolicies)
        ? parsed.governance.appliedApprovalPolicies
        : [],
      approvalRecommendationObservations: Array.isArray(parsed.governance?.approvalRecommendationObservations)
        ? parsed.governance.approvalRecommendationObservations
        : [],
      approvalTrustAlertAcks: Array.isArray(parsed.governance?.approvalTrustAlertAcks)
        ? parsed.governance.approvalTrustAlertAcks
        : [],
      approvalTrustHistory: Array.isArray(parsed.governance?.approvalTrustHistory)
        ? parsed.governance.approvalTrustHistory
        : [],
      workspacePolicyOverrides:
        isPlainObject(parsed.governance?.workspacePolicyOverrides)
          ? parsed.governance.workspacePolicyOverrides
          : {},
      workspacePolicyPlaybooks: Array.isArray(parsed.governance?.workspacePolicyPlaybooks)
        ? parsed.governance.workspacePolicyPlaybooks
        : [],
      workspacePolicyPlaybookRollouts: Array.isArray(parsed.governance?.workspacePolicyPlaybookRollouts)
        ? parsed.governance.workspacePolicyPlaybookRollouts
        : [],
      defaultPolicyPlaybookPresets: Array.isArray(parsed.governance?.defaultPolicyPlaybookPresets)
        ? parsed.governance.defaultPolicyPlaybookPresets
        : defaultGovernance.defaultPolicyPlaybookPresets,
      environmentPolicies: mergeEnvironmentPolicies(
        defaultGovernance.environmentPolicies,
        parsed.governance?.environmentPolicies
      ),
    },
    sharedSessions: Array.isArray(parsed.sharedSessions) ? parsed.sharedSessions : [],
    handoffs: Array.isArray(parsed.handoffs) ? parsed.handoffs : [],
    approvals: Array.isArray(parsed.approvals) ? parsed.approvals : [],
    inboxState: isPlainObject(parsed.inboxState) ? parsed.inboxState : {},
    inboxHistory: isPlainObject(parsed.inboxHistory) ? parsed.inboxHistory : {},
    digestPreferences: isPlainObject(parsed.digestPreferences) ? parsed.digestPreferences : {},
    digestRuns: isPlainObject(parsed.digestRuns) ? parsed.digestRuns : {},
    digestWorkspaceState: isPlainObject(parsed.digestWorkspaceState) ? parsed.digestWorkspaceState : {},
  };
}

function sanitizeCollaborationState(state = {}) {
  const defaultGovernance = createDefaultCollaborationGovernance();

  return {
    createdAt: state.createdAt || new Date().toISOString(),
    governance: {
      ...defaultGovernance,
      ...(state.governance || {}),
      demoScenario:
        state.governance?.demoScenario && typeof state.governance.demoScenario === "object"
          ? state.governance.demoScenario
          : defaultGovernance.demoScenario,
      appliedApprovalPolicies: Array.isArray(state.governance?.appliedApprovalPolicies)
        ? state.governance.appliedApprovalPolicies.slice(-50)
        : [],
      approvalRecommendationObservations: Array.isArray(state.governance?.approvalRecommendationObservations)
        ? state.governance.approvalRecommendationObservations.slice(-100)
        : [],
      approvalTrustAlertAcks: Array.isArray(state.governance?.approvalTrustAlertAcks)
        ? state.governance.approvalTrustAlertAcks.slice(-100)
        : [],
      approvalTrustHistory: Array.isArray(state.governance?.approvalTrustHistory)
        ? state.governance.approvalTrustHistory.slice(-500)
        : [],
      workspacePolicyOverrides:
        isPlainObject(state.governance?.workspacePolicyOverrides)
          ? state.governance.workspacePolicyOverrides
          : {},
      workspacePolicyPlaybooks: Array.isArray(state.governance?.workspacePolicyPlaybooks)
        ? state.governance.workspacePolicyPlaybooks.slice(-20)
        : [],
      workspacePolicyPlaybookRollouts: Array.isArray(state.governance?.workspacePolicyPlaybookRollouts)
        ? state.governance.workspacePolicyPlaybookRollouts.slice(-100)
        : [],
      defaultPolicyPlaybookPresets: Array.isArray(state.governance?.defaultPolicyPlaybookPresets)
        ? state.governance.defaultPolicyPlaybookPresets.slice(0, 20)
        : defaultGovernance.defaultPolicyPlaybookPresets,
      environmentPolicies: mergeEnvironmentPolicies(
        defaultGovernance.environmentPolicies,
        state.governance?.environmentPolicies
      ),
    },
    sharedSessions: Array.isArray(state.sharedSessions) ? state.sharedSessions.slice(-100) : [],
    handoffs: Array.isArray(state.handoffs) ? state.handoffs.slice(-100) : [],
    approvals: Array.isArray(state.approvals) ? state.approvals.slice(-100) : [],
    inboxState: isPlainObject(state.inboxState) ? state.inboxState : {},
    inboxHistory: isPlainObject(state.inboxHistory) ? state.inboxHistory : {},
    digestPreferences: isPlainObject(state.digestPreferences) ? state.digestPreferences : {},
    digestRuns: isPlainObject(state.digestRuns) ? state.digestRuns : {},
    digestWorkspaceState: isPlainObject(state.digestWorkspaceState) ? state.digestWorkspaceState : {},
  };
}

module.exports = {
  createDefaultCollaborationGovernance,
  createDefaultCollaborationState,
  normalizeCollaborationState,
  sanitizeCollaborationState,
};
