const fs = require("fs");
const path = require("path");
const { loadDocument, saveDocument } = require("./stateDatabase");
const { getAgentsDataPath } = require("./runtimePaths");
const {
  createDefaultCollaborationState,
  normalizeCollaborationState,
  sanitizeCollaborationState,
} = require("./collaborationState");

const COLLAB_PATH = getAgentsDataPath("collaboration.json");
const COLLAB_KEY = "collaboration";

function ensureCollaborationDir() {
  fs.mkdirSync(path.dirname(COLLAB_PATH), { recursive: true });
}

function defaultCollaborationState() {
  return createDefaultCollaborationState();
}

function loadCollaborationState() {
  ensureCollaborationDir();

  try {
    const parsed = loadDocument(COLLAB_KEY, defaultCollaborationState, { legacyPath: COLLAB_PATH });
    return normalizeCollaborationState(parsed);
  } catch (error) {
    return {
      ...createDefaultCollaborationState(),
      updatedAt: new Date().toISOString(),
      error: `Failed to parse collaboration state: ${error.message}`,
    };
  }
}

function saveCollaborationState(state) {
  ensureCollaborationDir();
  return saveDocument(
    COLLAB_KEY,
    sanitizeCollaborationState(state),
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
