const fs = require("fs");
const path = require("path");
const { getTaskById, addTask } = require("./taskQueue");
const { sendReviewReply } = require("./reviewReplies");
const { loadDocument, saveDocument } = require("./stateDatabase");

const REVIEW_PATH = path.join(process.cwd(), "data", "agents", "reviewQueue.json");
const AGENT_LOG_DIR = path.join(process.cwd(), "logs", "agents");
const REVIEW_KEY = "reviewQueue";

function ensureReviewDir() {
  fs.mkdirSync(path.dirname(REVIEW_PATH), { recursive: true });
  fs.mkdirSync(AGENT_LOG_DIR, { recursive: true });
}

function defaultReviewState() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: []
  };
}

function loadReviewState() {
  ensureReviewDir();

  try {
    const parsed = loadDocument(REVIEW_KEY, defaultReviewState, { legacyPath: REVIEW_PATH });
    parsed.items = Array.isArray(parsed.items) ? parsed.items : [];
    return parsed;
  } catch (error) {
    return {
      createdAt: null,
      updatedAt: new Date().toISOString(),
      items: [],
      error: `Failed to parse review queue file: ${error.message}`
    };
  }
}

function saveReviewState(state) {
  ensureReviewDir();

  return saveDocument(
    REVIEW_KEY,
    {
      createdAt: state.createdAt || new Date().toISOString(),
      items: Array.isArray(state.items) ? state.items : [],
    },
    { legacyPath: REVIEW_PATH }
  );
}

function logReviewEvent(payload) {
  ensureReviewDir();
  const logPath = path.join(AGENT_LOG_DIR, "manager.log");
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    reviewEvent: true,
    ...payload
  });
  fs.appendFileSync(logPath, line + "\n", "utf8");
}

function makeReviewItem(task) {
  return {
    id: `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    taskId: task.id,
    agentName: task.agentName,
    taskDescription: task.description,
    taskResult: task.result,
    callbackMessageId: task.callback?.callbackMessageId || null,
    status: "pending",
    decision: null,
    decisionNote: null,
    followupTaskId: null,
    reviewReply: {
      sent: false,
      replyType: null,
      messageId: null,
      sentAt: null
    },
    createdAt: new Date().toISOString(),
    reviewedAt: null
  };
}

function listReviewItems() {
  return loadReviewState().items;
}

function getReviewItemByTaskId(taskId) {
  return loadReviewState().items.find((item) => item.taskId === taskId) || null;
}

function addReviewItemForTask(taskId) {
  const task = getTaskById(taskId);

  if (!task) {
    return {
      ok: false,
      message: `Task not found: ${taskId}`
    };
  }

  const existing = getReviewItemByTaskId(taskId);
  if (existing) {
    return {
      ok: true,
      message: `Review item already exists for task "${taskId}".`,
      item: existing
    };
  }

  const state = loadReviewState();
  const item = makeReviewItem(task);
  state.items.push(item);
  saveReviewState(state);

  logReviewEvent({
    event: "review_item_added",
    taskId: task.id,
    reviewId: item.id,
    agentName: task.agentName
  });

  return {
    ok: true,
    message: `Review item created for task "${taskId}".`,
    item
  };
}

function updateReviewItem(taskId, updater) {
  const state = loadReviewState();
  const index = state.items.findIndex((item) => item.taskId === taskId);

  if (index === -1) {
    return null;
  }

  const current = state.items[index];
  const updated = typeof updater === "function" ? updater(current) : current;
  state.items[index] = updated;
  saveReviewState(state);
  return state.items[index];
}

function markReplySent(taskId, replyType, messageId) {
  return updateReviewItem(taskId, (current) => {
    return {
      ...current,
      reviewReply: {
        sent: true,
        replyType: replyType || null,
        messageId: messageId || null,
        sentAt: new Date().toISOString()
      }
    };
  });
}

function approveReviewItem(taskId) {
  const item = updateReviewItem(taskId, (current) => {
    return {
      ...current,
      status: "reviewed",
      decision: "approved",
      decisionNote: "Manager approved completed work.",
      reviewedAt: new Date().toISOString()
    };
  });

  if (!item) {
    return {
      ok: false,
      message: `Review item not found for task "${taskId}".`
    };
  }

  const replyResult = sendReviewReply(item, "approved");
  let updatedItem = item;

  if (replyResult.ok) {
    updatedItem = markReplySent(taskId, "approved", replyResult.replyMessage.id) || item;
  }

  logReviewEvent({
    event: "review_approved",
    taskId,
    reviewId: item.id,
    replySent: Boolean(replyResult.ok)
  });

  return {
    ok: true,
    message: `Task "${taskId}" approved by manager.`,
    item: updatedItem,
    replyResult
  };
}

function reviseReviewItem(taskId, note) {
  const item = updateReviewItem(taskId, (current) => {
    return {
      ...current,
      status: "reviewed",
      decision: "revise",
      decisionNote: String(note || "").trim() || "Manager requested revision.",
      reviewedAt: new Date().toISOString()
    };
  });

  if (!item) {
    return {
      ok: false,
      message: `Review item not found for task "${taskId}".`
    };
  }

  const replyResult = sendReviewReply(item, "revise");
  let updatedItem = item;

  if (replyResult.ok) {
    updatedItem = markReplySent(taskId, "revise", replyResult.replyMessage.id) || item;
  }

  logReviewEvent({
    event: "review_revision_requested",
    taskId,
    reviewId: item.id,
    note: item.decisionNote,
    replySent: Boolean(replyResult.ok)
  });

  return {
    ok: true,
    message: `Revision requested for task "${taskId}".`,
    item: updatedItem,
    replyResult
  };
}

function createFollowupTask(taskId, agentName, description) {
  const existing = getReviewItemByTaskId(taskId);

  if (!existing) {
    return {
      ok: false,
      message: `Review item not found for task "${taskId}".`
    };
  }

  const followup = addTask(agentName, description, {
    sourceAgent: "manager",
    priority: 2,
    delegationReason: `Follow-up created from review of task ${taskId}.`,
    tags: ["review-followup", "manager-generated"],
    notifyAgent: "manager",
    callbackEnabled: true
  });

  const updatedBase = updateReviewItem(taskId, (current) => {
    return {
      ...current,
      status: "reviewed",
      decision: current.decision || "followup_created",
      decisionNote: current.decisionNote || "Manager created follow-up task.",
      followupTaskId: followup.id,
      reviewedAt: new Date().toISOString()
    };
  });

  const replyResult = sendReviewReply(updatedBase, "followup_created", followup.id);
  let updated = updatedBase;

  if (replyResult.ok) {
    updated = markReplySent(taskId, "followup_created", replyResult.replyMessage.id) || updatedBase;
  }

  logReviewEvent({
    event: "review_followup_created",
    originalTaskId: taskId,
    followupTaskId: followup.id,
    targetAgent: agentName,
    replySent: Boolean(replyResult.ok)
  });

  return {
    ok: true,
    message: `Follow-up task "${followup.id}" created from task "${taskId}".`,
    followupTask: followup,
    item: updated,
    replyResult
  };
}

module.exports = {
  loadReviewState,
  saveReviewState,
  listReviewItems,
  getReviewItemByTaskId,
  addReviewItemForTask,
  approveReviewItem,
  reviseReviewItem,
  createFollowupTask
};
