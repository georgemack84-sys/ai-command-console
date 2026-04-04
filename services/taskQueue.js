const fs = require("fs");
const path = require("path");
const { loadDocument, saveDocument } = require("./stateDatabase");
const { getAgentsDataPath } = require("./runtimePaths");

const QUEUE_PATH = getAgentsDataPath("taskQueue.json");
const QUEUE_KEY = "taskQueue";

function ensureQueueDir() {
  fs.mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
}

function defaultQueue() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tasks: []
  };
}

function loadQueue() {
  try {
    const parsed = loadDocument(QUEUE_KEY, defaultQueue, { legacyPath: QUEUE_PATH });
    parsed.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    return parsed;
  } catch (error) {
    return {
      createdAt: null,
      updatedAt: new Date().toISOString(),
      tasks: [],
      error: `Failed to parse queue file: ${error.message}`
    };
  }
}

function saveQueue(queue) {
  ensureQueueDir();

  return saveDocument(
    QUEUE_KEY,
    {
      createdAt: queue.createdAt || new Date().toISOString(),
      tasks: Array.isArray(queue.tasks) ? queue.tasks : [],
    },
    { legacyPath: QUEUE_PATH }
  );
}

function makeTask(agentName, description, options = {}) {
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    agentName,
    description: String(description || "").trim(),
    status: "queued",
    priority: Number.isFinite(Number(options.priority)) ? Number(options.priority) : 3,
    sourceAgent: options.sourceAgent || "user",
    delegationReason: options.delegationReason || "",
    tags: Array.isArray(options.tags) ? options.tags : [],
    sourceMessageId: options.sourceMessageId || null,
    sourceInboxAgent: options.sourceInboxAgent || null,
    workspaceId: options.workspaceId || null,
    ownerId: options.ownerId || null,
    ownerName: options.ownerName || null,
    linkedInboxItemId: options.linkedInboxItemId || null,
    linkedWorkspaceId: options.linkedWorkspaceId || null,
    callback: {
      enabled: options.callbackEnabled !== false,
      notifyAgent: options.notifyAgent || "manager",
      callbackMessageId: null,
      callbackSentAt: null,
      callbackSummary: null
    },
    createdAt: new Date().toISOString(),
    claimedAt: null,
    completedAt: null,
    result: null
  };
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const priorityDiff = Number(a.priority || 3) - Number(b.priority || 3);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function addTask(agentName, description, options = {}) {
  const queue = loadQueue();
  const task = makeTask(agentName, description, options);
  queue.tasks.push(task);
  saveQueue(queue);
  return task;
}

function listTasks() {
  return sortTasks(loadQueue().tasks);
}

function getTasksForAgent(agentName) {
  return sortTasks(
    loadQueue().tasks.filter(
      (task) => String(task.agentName).toLowerCase() === String(agentName).toLowerCase()
    )
  );
}

function peekNextTask(agentName) {
  const tasks = getTasksForAgent(agentName).filter((task) => task.status === "queued");
  return tasks.length ? tasks[0] : null;
}

function claimNextTask(agentName) {
  const queue = loadQueue();

  const queuedMatches = queue.tasks.filter(
    (item) =>
      String(item.agentName).toLowerCase() === String(agentName).toLowerCase() &&
      item.status === "queued"
  );

  const nextTask = sortTasks(queuedMatches)[0];

  if (!nextTask) {
    return null;
  }

  const realTask = queue.tasks.find((item) => item.id === nextTask.id);
  realTask.status = "claimed";
  realTask.claimedAt = new Date().toISOString();

  saveQueue(queue);
  return realTask;
}

function getTaskById(taskId) {
  const queue = loadQueue();
  return queue.tasks.find((item) => item.id === taskId) || null;
}

function updateTask(taskId, updater) {
  const queue = loadQueue();
  const index = queue.tasks.findIndex((item) => item.id === taskId);

  if (index === -1) {
    return null;
  }

  const current = queue.tasks[index];
  const updated = typeof updater === "function" ? updater(current) : current;

  queue.tasks[index] = updated;
  saveQueue(queue);
  return queue.tasks[index];
}

function completeTask(taskId, result) {
  return updateTask(taskId, (task) => {
    const next = { ...task };
    next.status = "completed";
    next.completedAt = new Date().toISOString();
    next.result = result || null;
    return next;
  });
}

function setTaskCallback(taskId, callbackPatch = {}) {
  return updateTask(taskId, (task) => {
    const next = { ...task };
    next.callback = {
      enabled: true,
      notifyAgent: "manager",
      callbackMessageId: null,
      callbackSentAt: null,
      callbackSummary: null,
      ...(task.callback || {}),
      ...(callbackPatch || {})
    };
    return next;
  });
}

function clearQueue() {
  const queue = loadQueue();
  queue.tasks = [];
  return saveQueue(queue);
}

module.exports = {
  loadQueue,
  saveQueue,
  addTask,
  listTasks,
  getTasksForAgent,
  peekNextTask,
  claimNextTask,
  getTaskById,
  updateTask,
  completeTask,
  setTaskCallback,
  clearQueue
};
