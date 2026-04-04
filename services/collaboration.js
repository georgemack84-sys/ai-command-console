const fs = require("fs");
const path = require("path");
const { loadDocument, saveDocument } = require("./stateDatabase");
const { getAgentsDataPath } = require("./runtimePaths");

const COLLAB_PATH = getAgentsDataPath("collaboration.json");
const COLLAB_KEY = "collaboration";

function ensureCollaborationDir() {
  fs.mkdirSync(path.dirname(COLLAB_PATH), { recursive: true });
}

function defaultCollaborationState() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    governance: {
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
    },
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

function loadCollaborationState() {
  ensureCollaborationDir();

  try {
    const parsed = loadDocument(COLLAB_KEY, defaultCollaborationState, { legacyPath: COLLAB_PATH });
    return {
      ...defaultCollaborationState(),
      ...parsed,
      governance: {
        ...defaultCollaborationState().governance,
        ...(parsed.governance || {}),
        demoScenario:
          parsed.governance?.demoScenario && typeof parsed.governance.demoScenario === "object"
            ? parsed.governance.demoScenario
            : defaultCollaborationState().governance.demoScenario,
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
          parsed.governance?.workspacePolicyOverrides && typeof parsed.governance.workspacePolicyOverrides === "object"
            ? parsed.governance.workspacePolicyOverrides
            : {},
        workspacePolicyPlaybooks: Array.isArray(parsed.governance?.workspacePolicyPlaybooks)
          ? parsed.governance.workspacePolicyPlaybooks
          : [],
        workspacePolicyPlaybookRollouts: Array.isArray(parsed.governance?.workspacePolicyPlaybookRollouts)
          ? parsed.governance.workspacePolicyPlaybookRollouts
          : [],
        environmentPolicies: {
          ...defaultCollaborationState().governance.environmentPolicies,
          ...(parsed.governance?.environmentPolicies || {}),
        },
      },
      sharedSessions: Array.isArray(parsed.sharedSessions) ? parsed.sharedSessions : [],
      handoffs: Array.isArray(parsed.handoffs) ? parsed.handoffs : [],
      approvals: Array.isArray(parsed.approvals) ? parsed.approvals : [],
      inboxState: parsed.inboxState && typeof parsed.inboxState === "object" ? parsed.inboxState : {},
      inboxHistory: parsed.inboxHistory && typeof parsed.inboxHistory === "object" ? parsed.inboxHistory : {},
      digestPreferences: parsed.digestPreferences && typeof parsed.digestPreferences === "object" ? parsed.digestPreferences : {},
      digestRuns: parsed.digestRuns && typeof parsed.digestRuns === "object" ? parsed.digestRuns : {},
      digestWorkspaceState: parsed.digestWorkspaceState && typeof parsed.digestWorkspaceState === "object" ? parsed.digestWorkspaceState : {},
    };
  } catch (error) {
    return {
      ...defaultCollaborationState(),
      updatedAt: new Date().toISOString(),
      error: `Failed to parse collaboration state: ${error.message}`,
    };
  }
}

function saveCollaborationState(state) {
  ensureCollaborationDir();
  return saveDocument(
    COLLAB_KEY,
    {
      createdAt: state.createdAt || new Date().toISOString(),
      governance: {
        ...defaultCollaborationState().governance,
        ...(state.governance || {}),
        demoScenario:
          state.governance?.demoScenario && typeof state.governance.demoScenario === "object"
            ? state.governance.demoScenario
            : defaultCollaborationState().governance.demoScenario,
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
          state.governance?.workspacePolicyOverrides && typeof state.governance.workspacePolicyOverrides === "object"
            ? state.governance.workspacePolicyOverrides
            : {},
        workspacePolicyPlaybooks: Array.isArray(state.governance?.workspacePolicyPlaybooks)
          ? state.governance.workspacePolicyPlaybooks.slice(-20)
          : [],
        workspacePolicyPlaybookRollouts: Array.isArray(state.governance?.workspacePolicyPlaybookRollouts)
          ? state.governance.workspacePolicyPlaybookRollouts.slice(-100)
          : [],
        environmentPolicies: {
          ...defaultCollaborationState().governance.environmentPolicies,
          ...(state.governance?.environmentPolicies || {}),
        },
      },
      sharedSessions: Array.isArray(state.sharedSessions) ? state.sharedSessions.slice(-100) : [],
      handoffs: Array.isArray(state.handoffs) ? state.handoffs.slice(-100) : [],
      approvals: Array.isArray(state.approvals) ? state.approvals.slice(-100) : [],
      inboxState: state.inboxState && typeof state.inboxState === "object" ? state.inboxState : {},
      inboxHistory: state.inboxHistory && typeof state.inboxHistory === "object" ? state.inboxHistory : {},
      digestPreferences: state.digestPreferences && typeof state.digestPreferences === "object" ? state.digestPreferences : {},
      digestRuns: state.digestRuns && typeof state.digestRuns === "object" ? state.digestRuns : {},
      digestWorkspaceState: state.digestWorkspaceState && typeof state.digestWorkspaceState === "object" ? state.digestWorkspaceState : {},
    },
    { legacyPath: COLLAB_PATH }
  );
}

function getInboxState(userId) {
  const state = loadCollaborationState();
  const key = String(userId || "demo");
  const scoped = state.inboxState && typeof state.inboxState === "object" ? state.inboxState[key] : {};
  return scoped && typeof scoped === "object" ? scoped : {};
}

function updateInboxItemState(userId, itemId, updates = {}) {
  const state = loadCollaborationState();
  const key = String(userId || "demo");
  const current = state.inboxState && typeof state.inboxState === "object" ? state.inboxState : {};
  const scoped = current[key] && typeof current[key] === "object" ? current[key] : {};
  const nextItem = {
    ...(scoped[itemId] && typeof scoped[itemId] === "object" ? scoped[itemId] : {}),
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  state.inboxState = {
    ...current,
    [key]: {
      ...scoped,
      [itemId]: nextItem,
    },
  };
  saveCollaborationState(state);
  return nextItem;
}

function getInboxHistory(userId) {
  const state = loadCollaborationState();
  const key = String(userId || "demo");
  const scoped = state.inboxHistory && typeof state.inboxHistory === "object" ? state.inboxHistory[key] : [];
  return Array.isArray(scoped) ? scoped : [];
}

function recordInboxHistoryItem(userId, item) {
  const state = loadCollaborationState();
  const key = String(userId || "demo");
  const current = state.inboxHistory && typeof state.inboxHistory === "object" ? state.inboxHistory : {};
  const scoped = Array.isArray(current[key]) ? current[key] : [];
  const normalized = {
    ...item,
    recordedAt: item.recordedAt || new Date().toISOString(),
  };
  state.inboxHistory = {
    ...current,
    [key]: [normalized, ...scoped.filter((entry) => entry.id !== normalized.id)].slice(0, 80),
  };
  saveCollaborationState(state);
  return normalized;
}

function getDigestPreferences(userId) {
  const state = loadCollaborationState();
  const key = String(userId || "demo");
  const scoped = state.digestPreferences && typeof state.digestPreferences === "object" ? state.digestPreferences[key] : {};
  return {
    enabled: false,
    cadence: "manual",
    preferredChannel: "inbox",
    includeTrustReport: false,
    trustAudience: "self",
    trustEnvironment: "all",
    immediateOnTrustDrop: false,
    ...((scoped && typeof scoped === "object") ? scoped : {}),
  };
}

function updateDigestPreferences(userId, updates = {}) {
  const state = loadCollaborationState();
  const key = String(userId || "demo");
  const current = state.digestPreferences && typeof state.digestPreferences === "object" ? state.digestPreferences : {};
  const next = {
    ...getDigestPreferences(userId),
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  state.digestPreferences = {
    ...current,
    [key]: next,
  };
  saveCollaborationState(state);
  return next;
}

function listDigestRuns(userId) {
  const state = loadCollaborationState();
  const key = String(userId || "demo");
  const scoped = state.digestRuns && typeof state.digestRuns === "object" ? state.digestRuns[key] : [];
  return Array.isArray(scoped) ? scoped : [];
}

function recordDigestRun(userId, digest) {
  const state = loadCollaborationState();
  const key = String(userId || "demo");
  const current = state.digestRuns && typeof state.digestRuns === "object" ? state.digestRuns : {};
  const scoped = Array.isArray(current[key]) ? current[key] : [];
  const entry = {
    id: digest.id || `digest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: digest.createdAt || new Date().toISOString(),
    summary: digest.summary || "",
    stats: digest.stats || {},
    highlights: Array.isArray(digest.highlights) ? digest.highlights : [],
    report: digest.report || "",
    reportType: digest.reportType || "notification",
  };
  state.digestRuns = {
    ...current,
    [key]: [entry, ...scoped].slice(0, 40),
  };
  const currentPreferences = state.digestPreferences && typeof state.digestPreferences === "object" ? state.digestPreferences : {};
  state.digestPreferences = {
    ...currentPreferences,
    [key]: {
      ...getDigestPreferences(userId),
      ...(currentPreferences[key] && typeof currentPreferences[key] === "object" ? currentPreferences[key] : {}),
      lastDigestAt: entry.createdAt,
    },
  };
  saveCollaborationState(state);
  return entry;
}

function getDigestWorkspaceState(workspaceId) {
  const state = loadCollaborationState();
  const key = String(workspaceId || "default");
  const scoped = state.digestWorkspaceState && typeof state.digestWorkspaceState === "object" ? state.digestWorkspaceState[key] : {};
  return scoped && typeof scoped === "object" ? scoped : {};
}

function updateDigestWorkspaceState(workspaceId, updates = {}) {
  const state = loadCollaborationState();
  const key = String(workspaceId || "default");
  const current = state.digestWorkspaceState && typeof state.digestWorkspaceState === "object" ? state.digestWorkspaceState : {};
  const existing = current[key] && typeof current[key] === "object" ? current[key] : {};
  const next = {
    ...existing,
    ...updates,
    events: Array.isArray(updates.events) ? updates.events : Array.isArray(existing.events) ? existing.events : [],
    updatedAt: new Date().toISOString(),
  };
  state.digestWorkspaceState = {
    ...current,
    [key]: next,
  };
  saveCollaborationState(state);
  return next;
}

function appendDigestWorkspaceEvent(workspaceId, event = {}) {
  const current = getDigestWorkspaceState(workspaceId);
  const entry = {
    id: event.id || `workspace_event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: String(event.type || "workspace-note"),
    message: String(event.message || "Workspace automation event recorded."),
    actorId: event.actorId || null,
    actorName: event.actorName || null,
    note: event.note || null,
    timestamp: event.timestamp || new Date().toISOString(),
  };
  const events = [entry, ...(Array.isArray(current.events) ? current.events : [])].slice(0, 40);
  return updateDigestWorkspaceState(workspaceId, { events });
}

function upsertSharedSession(session) {
  const state = loadCollaborationState();
  const next = {
    id: session.id || `shared_session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: String(session.name || "").trim(),
    draftCommand: String(session.draftCommand || "").trim(),
    macros: Array.isArray(session.macros) ? session.macros : [],
    ownerId: session.ownerId || "demo",
    ownerName: session.ownerName || "Demo User",
    sharedWith: Array.isArray(session.sharedWith) ? session.sharedWith : ["team"],
    updatedAt: new Date().toISOString(),
    createdAt: session.createdAt || new Date().toISOString(),
  };
  state.sharedSessions = [next, ...state.sharedSessions.filter((item) => item.id !== next.id)];
  saveCollaborationState(state);
  return next;
}

function createHandoff(handoff) {
  const state = loadCollaborationState();
  const next = {
    id: `handoff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: String(handoff.title || "").trim(),
    note: String(handoff.note || "").trim(),
    assignedTo: handoff.assignedTo || "team",
    assignedById: handoff.assignedById || "demo",
    assignedByName: handoff.assignedByName || "Demo User",
    kind: handoff.kind || "general",
    workspaceId: handoff.workspaceId || null,
    relatedApprovalId: handoff.relatedApprovalId || null,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  state.handoffs = [next, ...state.handoffs];
  saveCollaborationState(state);
  return next;
}

function closeHandoff(handoffId) {
  const state = loadCollaborationState();
  const index = state.handoffs.findIndex((item) => item.id === handoffId);
  if (index === -1) {
    return null;
  }
  state.handoffs[index] = {
    ...state.handoffs[index],
    status: "closed",
    closedAt: new Date().toISOString(),
  };
  saveCollaborationState(state);
  return state.handoffs[index];
}

function createApprovalRequest(request) {
  const state = loadCollaborationState();
  const next = {
    id: `approval_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action: request.action,
    payload: request.payload || {},
    label: request.label || request.action,
    approverTarget: request.approverTarget || null,
    routingMode: request.routingMode || null,
    routingReason: request.routingReason || null,
    routedFromTarget: request.routedFromTarget || null,
    requestedById: request.requestedById || "demo",
    requestedByName: request.requestedByName || "Demo User",
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  state.approvals = [next, ...state.approvals];
  saveCollaborationState(state);
  return next;
}

function getApprovalRequest(approvalId) {
  return loadCollaborationState().approvals.find((item) => item.id === approvalId) || null;
}

function resolveApprovalRequest(approvalId, updates = {}) {
  const state = loadCollaborationState();
  const index = state.approvals.findIndex((item) => item.id === approvalId);
  if (index === -1) {
    return null;
  }
  state.approvals[index] = {
    ...state.approvals[index],
    ...updates,
    resolvedAt: new Date().toISOString(),
  };
  saveCollaborationState(state);
  return state.approvals[index];
}

function updateApprovalRequest(approvalId, updates = {}) {
  const state = loadCollaborationState();
  const index = state.approvals.findIndex((item) => item.id === approvalId);
  if (index === -1) {
    return null;
  }
  state.approvals[index] = {
    ...state.approvals[index],
    ...updates,
  };
  saveCollaborationState(state);
  return state.approvals[index];
}

function updateGovernance(updates = {}) {
  const state = loadCollaborationState();
  state.governance = {
    ...state.governance,
    ...(updates || {}),
  };
  saveCollaborationState(state);
  return state.governance;
}

module.exports = {
  loadCollaborationState,
  saveCollaborationState,
  upsertSharedSession,
  createHandoff,
  closeHandoff,
  createApprovalRequest,
  getApprovalRequest,
  resolveApprovalRequest,
  updateApprovalRequest,
  updateGovernance,
  getInboxState,
  updateInboxItemState,
  getInboxHistory,
  recordInboxHistoryItem,
  getDigestPreferences,
  updateDigestPreferences,
  listDigestRuns,
  recordDigestRun,
  getDigestWorkspaceState,
  updateDigestWorkspaceState,
  appendDigestWorkspaceEvent,
};
