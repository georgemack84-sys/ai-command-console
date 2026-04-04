const fs = require("fs");
const path = require("path");
const { loadDocument, saveDocument } = require("./stateDatabase");
const { getAgentsDataPath } = require("./runtimePaths");

const POLICY_PATH = getAgentsDataPath("automation-policy.json");
const POLICY_KEY = "automationPolicy";

function ensurePolicyDir() {
  fs.mkdirSync(path.dirname(POLICY_PATH), { recursive: true });
}

function defaultPolicyState() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    escalation: {
      autoRunWatcherOnPolicySave: false,
      autoRunAlertsOnPolicySave: false,
      autoAcknowledgeWatcherStopped: false,
      preferredAlertOwner: "manager",
    },
    remediation: {
      allowScheduleRestartRecommendations: true,
      allowAlertResolutionRecommendations: true,
      allowReviewFollowupRecommendations: true,
    },
  };
}

function loadAutomationPolicy() {
  ensurePolicyDir();

  try {
    const parsed = loadDocument(POLICY_KEY, defaultPolicyState, { legacyPath: POLICY_PATH });
    return {
      ...defaultPolicyState(),
      ...parsed,
      escalation: {
        ...defaultPolicyState().escalation,
        ...(parsed.escalation || {}),
      },
      remediation: {
        ...defaultPolicyState().remediation,
        ...(parsed.remediation || {}),
      },
    };
  } catch (error) {
    return {
      ...defaultPolicyState(),
      updatedAt: new Date().toISOString(),
      error: `Failed to parse automation policy: ${error.message}`,
    };
  }
}

function saveAutomationPolicy(state) {
  ensurePolicyDir();

  const normalized = {
    createdAt: state.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    escalation: {
      ...defaultPolicyState().escalation,
      ...(state.escalation || {}),
    },
    remediation: {
      ...defaultPolicyState().remediation,
      ...(state.remediation || {}),
    },
  };

  return saveDocument(POLICY_KEY, normalized, { legacyPath: POLICY_PATH });
}

function updateAutomationPolicy(updates = {}) {
  const current = loadAutomationPolicy();
  return saveAutomationPolicy({
    ...current,
    escalation: {
      ...current.escalation,
      ...(updates.escalation || {}),
    },
    remediation: {
      ...current.remediation,
      ...(updates.remediation || {}),
    },
  });
}

module.exports = {
  loadAutomationPolicy,
  saveAutomationPolicy,
  updateAutomationPolicy,
};
