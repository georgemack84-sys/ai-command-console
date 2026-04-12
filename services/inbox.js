const fs = require("fs");
const path = require("path");
const { loadJsonDocument, saveJsonDocument } = require("./documentStore");
const { getAgentsDataPath, getRuntimeLogPath } = require("./runtimePaths");

const INBOX_PATH = getAgentsDataPath("inbox.json");
const AGENT_LOG_DIR = getRuntimeLogPath("agents");
const INBOX_KEY = "inbox";

function ensureInboxDir() {
  fs.mkdirSync(path.dirname(INBOX_PATH), { recursive: true });
  fs.mkdirSync(AGENT_LOG_DIR, { recursive: true });
}

function defaultInboxState() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inboxes: {}
  };
}

function loadInboxState() {
  ensureInboxDir();
  return loadJsonDocument(INBOX_KEY, INBOX_PATH, defaultInboxState, (parsed) => ({
    ...defaultInboxState(),
    ...parsed,
    inboxes:
      parsed?.inboxes && typeof parsed.inboxes === "object" ? parsed.inboxes : {},
  }));
}

function saveInboxState(state) {
  ensureInboxDir();

  const normalized = {
    createdAt: state.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inboxes:
      state.inboxes && typeof state.inboxes === "object" ? state.inboxes : {}
  };

  return saveJsonDocument(INBOX_KEY, INBOX_PATH, normalized);
}

function logInboxEvent(agentName, payload) {
  ensureInboxDir();
  const safeAgentName = String(agentName || "system").trim().toLowerCase() || "system";
  const logPath = path.join(AGENT_LOG_DIR, `${safeAgentName}.log`);
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    inboxEvent: true,
    ...payload
  });
  fs.appendFileSync(logPath, line + "\n", "utf8");
}

function ensureAgentInbox(state, agentName) {
  const key = String(agentName || "").trim().toLowerCase();
  if (!key) {
    throw new Error("Agent name is required.");
  }

  if (!state.inboxes[key]) {
    state.inboxes[key] = {
      agentName: key,
      messages: []
    };
  }

  if (!Array.isArray(state.inboxes[key].messages)) {
    state.inboxes[key].messages = [];
  }

  return state.inboxes[key];
}

function defaultActionState() {
  return {
    convertedToTask: false,
    taskId: null,
    taskAgent: null,
    convertedAt: null,
    actionType: null,
    notes: []
  };
}

function defaultReviewIntakeState() {
  return {
    acknowledged: false,
    acknowledgedAt: null,
    taskified: false,
    taskifiedAt: null,
    intakeTaskId: null,
    intakeAgent: null,
    intakeType: null,
    notes: []
  };
}

function makeMessage(fromAgent, toAgent, body) {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    fromAgent: String(fromAgent || "").trim().toLowerCase(),
    toAgent: String(toAgent || "").trim().toLowerCase(),
    body: String(body || "").trim(),
    status: "unread",
    createdAt: new Date().toISOString(),
    readAt: null,
    actionState: defaultActionState(),
    reviewIntake: defaultReviewIntakeState()
  };
}

function sendMessage(fromAgent, toAgent, body) {
  const state = loadInboxState();
  const inbox = ensureAgentInbox(state, toAgent);
  const message = makeMessage(fromAgent, toAgent, body);

  if (!message.fromAgent || !message.toAgent || !message.body) {
    throw new Error("fromAgent, toAgent, and body are required.");
  }

  inbox.messages.push(message);
  saveInboxState(state);

  logInboxEvent(toAgent, {
    event: "message_received",
    messageId: message.id,
    fromAgent: message.fromAgent,
    toAgent: message.toAgent
  });

  logInboxEvent(fromAgent, {
    event: "message_sent",
    messageId: message.id,
    fromAgent: message.fromAgent,
    toAgent: message.toAgent
  });

  return message;
}

function listInbox(agentName) {
  const state = loadInboxState();
  const inbox = ensureAgentInbox(state, agentName);
  saveInboxState(state);
  return inbox.messages;
}

function getUnreadMessages(agentName) {
  return listInbox(agentName).filter((message) => message.status === "unread");
}

function getMessage(agentName, messageId) {
  const state = loadInboxState();
  const inbox = ensureAgentInbox(state, agentName);
  saveInboxState(state);
  return inbox.messages.find((item) => item.id === messageId) || null;
}

function updateMessage(agentName, messageId, updater) {
  const state = loadInboxState();
  const inbox = ensureAgentInbox(state, agentName);

  const index = inbox.messages.findIndex((item) => item.id === messageId);
  if (index === -1) {
    return null;
  }

  const current = inbox.messages[index];
  const nextCurrent = {
    ...current,
    actionState: current.actionState || defaultActionState(),
    reviewIntake: current.reviewIntake || defaultReviewIntakeState()
  };

  const updated = typeof updater === "function" ? updater(nextCurrent) : nextCurrent;
  inbox.messages[index] = updated;
  saveInboxState(state);
  return inbox.messages[index];
}

function readMessage(agentName, messageId) {
  const message = updateMessage(agentName, messageId, (current) => {
    const next = { ...current };
    if (next.status !== "read") {
      next.status = "read";
      next.readAt = new Date().toISOString();
    }
    return next;
  });

  if (!message) {
    return null;
  }

  logInboxEvent(agentName, {
    event: "message_read",
    messageId: message.id,
    fromAgent: message.fromAgent,
    toAgent: message.toAgent
  });

  return message;
}

function addMessageActionNote(agentName, messageId, note) {
  return updateMessage(agentName, messageId, (current) => {
    const next = { ...current };
    next.actionState = next.actionState || defaultActionState();
    next.actionState.notes = Array.isArray(next.actionState.notes)
      ? next.actionState.notes
      : [];
    next.actionState.notes.push({
      timestamp: new Date().toISOString(),
      note: String(note || "").trim()
    });
    return next;
  });
}

function markMessageConverted(agentName, messageId, taskId, taskAgent, actionType = "task_created") {
  return updateMessage(agentName, messageId, (current) => {
    const next = { ...current };
    next.actionState = next.actionState || defaultActionState();
    next.actionState.convertedToTask = true;
    next.actionState.taskId = taskId || null;
    next.actionState.taskAgent = taskAgent || null;
    next.actionState.convertedAt = new Date().toISOString();
    next.actionState.actionType = actionType;
    return next;
  });
}

function acknowledgeReviewMessage(agentName, messageId) {
  return updateMessage(agentName, messageId, (current) => {
    const next = { ...current };
    next.reviewIntake = next.reviewIntake || defaultReviewIntakeState();
    next.reviewIntake.acknowledged = true;
    next.reviewIntake.acknowledgedAt = new Date().toISOString();
    next.reviewIntake.notes = Array.isArray(next.reviewIntake.notes)
      ? next.reviewIntake.notes
      : [];
    next.reviewIntake.notes.push({
      timestamp: new Date().toISOString(),
      note: `Worker acknowledgment recorded for ${messageId}.`
    });
    return next;
  });
}

function markReviewMessageTaskified(agentName, messageId, taskId, intakeAgent, intakeType = "review_reply_task") {
  return updateMessage(agentName, messageId, (current) => {
    const next = { ...current };
    next.reviewIntake = next.reviewIntake || defaultReviewIntakeState();
    next.reviewIntake.taskified = true;
    next.reviewIntake.taskifiedAt = new Date().toISOString();
    next.reviewIntake.intakeTaskId = taskId || null;
    next.reviewIntake.intakeAgent = intakeAgent || null;
    next.reviewIntake.intakeType = intakeType;
    next.reviewIntake.notes = Array.isArray(next.reviewIntake.notes)
      ? next.reviewIntake.notes
      : [];
    next.reviewIntake.notes.push({
      timestamp: new Date().toISOString(),
      note: `Review reply converted into task ${taskId} for ${intakeAgent}.`
    });
    return next;
  });
}

function addReviewIntakeNote(agentName, messageId, note) {
  return updateMessage(agentName, messageId, (current) => {
    const next = { ...current };
    next.reviewIntake = next.reviewIntake || defaultReviewIntakeState();
    next.reviewIntake.notes = Array.isArray(next.reviewIntake.notes)
      ? next.reviewIntake.notes
      : [];
    next.reviewIntake.notes.push({
      timestamp: new Date().toISOString(),
      note: String(note || "").trim()
    });
    return next;
  });
}

function escalateToManager(fromAgent, body) {
  return sendMessage(fromAgent, "manager", body);
}

module.exports = {
  loadInboxState,
  saveInboxState,
  sendMessage,
  listInbox,
  getUnreadMessages,
  getMessage,
  updateMessage,
  readMessage,
  addMessageActionNote,
  markMessageConverted,
  acknowledgeReviewMessage,
  markReviewMessageTaskified,
  addReviewIntakeNote,
  escalateToManager
};
