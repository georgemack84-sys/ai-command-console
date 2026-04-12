const { canApproveInEnvironment, canManageGovernanceInEnvironment } = require("./permissions");
const { getInboxState, getInboxHistory } = require("./collaboration");

function normalizeTarget(value) {
  return String(value || "").trim().toLowerCase();
}

function extractTargets(value) {
  return String(value || "")
    .split(",")
    .map((item) => normalizeTarget(item))
    .filter(Boolean);
}

function buildActorTargets(actor) {
  return new Set([
    normalizeTarget(actor.id),
    normalizeTarget(actor.name),
    normalizeTarget(actor.role),
    `user:${normalizeTarget(actor.id)}`,
    `name:${normalizeTarget(actor.name)}`,
    `role:${normalizeTarget(actor.role)}`,
    "team",
  ]);
}

function matchesTargets(value, actorTargets) {
  const targets = extractTargets(value);
  if (!targets.length) {
    return false;
  }
  return targets.some((target) => actorTargets.has(target));
}

function buildInbox(actor, collaboration, ownershipSignals, digestEscalations = [], trustSignals = []) {
  const inboxState = getInboxState(actor.id);
  const actorTargets = buildActorTargets(actor);
  const inbox = [];
  const handoffs = Array.isArray(collaboration.handoffs) ? collaboration.handoffs : [];
  const approvals = Array.isArray(collaboration.approvals) ? collaboration.approvals : [];

  if (actor.role === "admin" || canManageGovernanceInEnvironment(actor.role, collaboration.governance)) {
    ownershipSignals.forEach((signal) => {
      inbox.push({
        id: `inbox:${signal.id}`,
        type: "ownership",
        status: "open",
        tone: signal.tone,
        title: signal.title,
        detail: signal.detail,
        command: signal.command,
        read: Boolean(inboxState[`inbox:${signal.id}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${signal.id}`]?.acknowledgedAt),
      });
    });
    digestEscalations.forEach((signal) => {
      inbox.push({
        id: `inbox:${signal.id}`,
        type: "automation",
        status: "open",
        tone: signal.tone,
        title: signal.title,
        detail: signal.detail,
        command: signal.command,
        workspaceId: signal.workspaceId,
        workspaceName: signal.workspaceName,
        owner: signal.owner,
        snoozedUntil: signal.snoozedUntil,
        read: Boolean(inboxState[`inbox:${signal.id}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${signal.id}`]?.acknowledgedAt),
      });
    });
    trustSignals.forEach((signal) => {
      inbox.push({
        id: `inbox:${signal.id}`,
        type: "trust",
        status: "open",
        tone: signal.tone,
        title: signal.title,
        detail: signal.detail,
        command: signal.command,
        environment: signal.environment || null,
        read: Boolean(inboxState[`inbox:${signal.id}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${signal.id}`]?.acknowledgedAt),
      });
    });
  }

  handoffs
    .filter((handoff) => handoff.status === "open" && matchesTargets(handoff.assignedTo, actorTargets))
    .slice(0, 8)
    .forEach((handoff) => {
      inbox.push({
        id: `inbox:${handoff.id}`,
        type: "handoff",
        status: handoff.status,
        tone: "warning",
        title: handoff.title,
        detail: `${handoff.assignedByName} assigned this handoff to ${handoff.assignedTo}. ${handoff.note}`,
        handoffId: handoff.id,
        kind: handoff.kind || "general",
        workspaceId: handoff.workspaceId || null,
        relatedApprovalId: handoff.relatedApprovalId || null,
        createdAt: handoff.createdAt || null,
        read: Boolean(inboxState[`inbox:${handoff.id}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${handoff.id}`]?.acknowledgedAt),
      });
    });

  approvals
    .filter((approval) => {
      if (
        approval.status === "pending" &&
        canApproveInEnvironment(actor.role, collaboration.governance) &&
        (!approval.approverTarget || matchesTargets(approval.approverTarget, actorTargets))
      ) {
        return true;
      }
      return approval.requestedById === actor.id;
    })
    .slice(0, 8)
    .forEach((approval) => {
      inbox.push({
        id: `inbox:${approval.id}`,
        type: "approval",
        status: approval.status,
        tone: approval.status === "pending" ? "warning" : approval.status === "approved" ? "active" : "error",
        title: approval.label,
        detail:
          approval.status === "pending"
            ? `${approval.requestedByName} is waiting on approval for ${approval.action}.${approval.approverTarget ? ` Target: ${approval.approverTarget}.` : ""}`
            : `${approval.requestedByName} request is ${approval.status}.`,
        approvalId: approval.id,
        approverTarget: approval.approverTarget || null,
        read: Boolean(inboxState[`inbox:${approval.id}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${approval.id}`]?.acknowledgedAt),
      });
    });

  return inbox.slice(0, 12);
}

function buildNotificationHistory(actor, collaboration, ownershipSignals, digestEscalations = [], trustSignals = []) {
  const liveItems = buildInbox(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  const history = getInboxHistory(actor.id);
  const merged = [...liveItems, ...history]
    .filter((item, index, collection) => collection.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((a, b) => {
      const aTime = new Date(a.recordedAt || a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.recordedAt || b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  return merged.slice(0, 40);
}

function buildNotificationDigest(inbox, history) {
  return {
    open: inbox.length,
    unread: inbox.filter((item) => !item.read).length,
    acknowledged: history.filter((item) => item.acknowledged).length,
    ownership: inbox.filter((item) => item.type === "ownership").length,
    handoffs: inbox.filter((item) => item.type === "handoff").length,
    approvals: inbox.filter((item) => item.type === "approval").length,
    trust: inbox.filter((item) => item.type === "trust").length,
  };
}

module.exports = {
  normalizeTarget,
  extractTargets,
  buildActorTargets,
  matchesTargets,
  buildInbox,
  buildNotificationHistory,
  buildNotificationDigest,
};
