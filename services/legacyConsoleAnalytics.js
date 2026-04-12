const {
  buildWorkspaceBackupApproverSuggestion: buildWorkspaceBackupApproverSuggestionImpl,
  buildRecommendationConfidence: buildRecommendationConfidenceImpl,
  buildApprovalPolicyRecommendations: buildApprovalPolicyRecommendationsImpl,
  summarizeApprovalPolicyRecommendationEffect: summarizeApprovalPolicyRecommendationEffectImpl,
  buildApprovalPolicyMetricsSnapshot: buildApprovalPolicyMetricsSnapshotImpl,
  evaluateAppliedApprovalPolicyImpact: evaluateAppliedApprovalPolicyImpactImpl,
} = require("./legacyConsoleAnalyticsRecommendations");
const {
  summarizeWorkspacePolicyOverride: summarizeWorkspacePolicyOverrideImpl,
  normalizePolicyPlaybookPayload: normalizePolicyPlaybookPayloadImpl,
  listDefaultPolicyPlaybookPresets: listDefaultPolicyPlaybookPresetsImpl,
  summarizePolicyPlaybookRollouts: summarizePolicyPlaybookRolloutsImpl,
  buildPolicyPlaybookAdoptionSummary: buildPolicyPlaybookAdoptionSummaryImpl,
  buildGlobalOperationsSummary: buildGlobalOperationsSummaryImpl,
} = require("./legacyConsoleAnalyticsPlaybooks");

function buildWorkspaceBackupApproverSuggestion(workspaceId, digestWorkspaceHealth = [], approvalThroughput = { targets: [] }, deps) {
  return buildWorkspaceBackupApproverSuggestionImpl(workspaceId, digestWorkspaceHealth, approvalThroughput, deps);
}

function buildRecommendationConfidence(kind, { pressureEntry = null, throughputTargetEntry = null, workspaceEntry = null } = {}) {
  return buildRecommendationConfidenceImpl(kind, { pressureEntry, throughputTargetEntry, workspaceEntry });
}

function buildApprovalPolicyRecommendations(
  incidentApprovalPressure = [],
  approvalThroughput = { targets: [], workspaces: [], totals: {} },
  environmentPolicy = {},
  digestWorkspaceHealth = [],
  deps
) {
  return buildApprovalPolicyRecommendationsImpl(
    incidentApprovalPressure,
    approvalThroughput,
    environmentPolicy,
    digestWorkspaceHealth,
    deps
  );
}

function summarizeApprovalPolicyRecommendationEffect(payload, outcome) {
  return summarizeApprovalPolicyRecommendationEffectImpl(payload, outcome);
}

function buildApprovalPolicyMetricsSnapshot(payload = {}, deps) {
  return buildApprovalPolicyMetricsSnapshotImpl(payload, deps);
}

function evaluateAppliedApprovalPolicyImpact(entry, incidentApprovalPressure = [], approvalThroughput = { targets: [], workspaces: [] }) {
  return evaluateAppliedApprovalPolicyImpactImpl(entry, incidentApprovalPressure, approvalThroughput);
}

function summarizeWorkspacePolicyOverride(override = {}) {
  return summarizeWorkspacePolicyOverrideImpl(override);
}

function normalizePolicyPlaybookPayload(payload = {}, actor = { id: "system", name: "System" }) {
  return normalizePolicyPlaybookPayloadImpl(payload, actor);
}

function listDefaultPolicyPlaybookPresets() {
  return listDefaultPolicyPlaybookPresetsImpl();
}

function summarizePolicyPlaybookRollouts(rollouts = []) {
  return summarizePolicyPlaybookRolloutsImpl(rollouts);
}

function buildPolicyPlaybookAdoptionSummary(
  rollouts = [],
  savedPlaybooks = [],
  presets = [],
  digestWorkspaceHealth = [],
  completedTrustIncidents = []
) {
  return buildPolicyPlaybookAdoptionSummaryImpl(
    rollouts,
    savedPlaybooks,
    presets,
    digestWorkspaceHealth,
    completedTrustIncidents
  );
}

function buildGlobalOperationsSummary(
  digestWorkspaceHealth = [],
  digestEscalations = [],
  incidentApprovalPressure = [],
  approvalTrustEnvironments = [],
  approvalTrustSignals = [],
  completedTrustIncidents = [],
  policyPlaybookRollouts = []
) {
  return buildGlobalOperationsSummaryImpl(
    digestWorkspaceHealth,
    digestEscalations,
    incidentApprovalPressure,
    approvalTrustEnvironments,
    approvalTrustSignals,
    completedTrustIncidents,
    policyPlaybookRollouts
  );
}

module.exports = {
  buildRecommendationConfidence,
  buildApprovalPolicyRecommendations,
  summarizeApprovalPolicyRecommendationEffect,
  buildApprovalPolicyMetricsSnapshot,
  evaluateAppliedApprovalPolicyImpact,
  summarizeWorkspacePolicyOverride,
  normalizePolicyPlaybookPayload,
  listDefaultPolicyPlaybookPresets,
  summarizePolicyPlaybookRollouts,
  buildPolicyPlaybookAdoptionSummary,
  buildGlobalOperationsSummary,
};
