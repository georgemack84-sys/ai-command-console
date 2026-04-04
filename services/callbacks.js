const fs = require("fs");
const path = require("path");
const { sendMessage } = require("./inbox");
const { getTaskById, setTaskCallback, listTasks } = require("./taskQueue");
const { addReviewItemForTask } = require("./reviewQueue");

const AGENT_LOG_DIR = path.join(process.cwd(), "logs", "agents");

function ensureLogDir() {
  fs.mkdirSync(AGENT_LOG_DIR, { recursive: true });
}

function logCallbackEvent(agentName, payload) {
  ensureLogDir();
  const safeAgentName = String(agentName || "manager").trim().toLowerCase() || "manager";
  const logPath = path.join(AGENT_LOG_DIR, `${safeAgentName}.log`);
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    callbackEvent: true,
    ...payload
  });
  fs.appendFileSync(logPath, line + "\n", "utf8");
}

function buildCallbackBody(task) {
  const worker = task.agentName || "unknown";
  const result = task.result || "(no result)";
  const taskId = task.id || "(unknown task)";
  const description = task.description || "(no description)";

  return [
    `Task completion report from ${worker}.`,
    `Task ID: ${taskId}`,
    `Task: ${description}`,
    `Result: ${result}`
  ].join(" ");
}

function sendTaskCompletionCallback(taskId) {
  const task = getTaskById(taskId);

  if (!task) {
    return {
      ok: false,
      message: `Task not found: ${taskId}`
    };
  }

  if (task.status !== "completed") {
    return {
      ok: false,
      message: `Task "${taskId}" is not completed yet.`
    };
  }

  const callback = task.callback || {};
  if (!callback.enabled) {
    return {
      ok: false,
      message: `Callback is disabled for task "${taskId}".`
    };
  }

  if (callback.callbackMessageId) {
    return {
      ok: false,
      message: `Callback already sent for task "${taskId}" as message "${callback.callbackMessageId}".`,
      task
    };
  }

  const notifyAgent = callback.notifyAgent || "manager";
  const body = buildCallbackBody(task);
  const message = sendMessage(task.agentName || "system", notifyAgent, body);

  const updatedTask = setTaskCallback(taskId, {
    callbackMessageId: message.id,
    callbackSentAt: new Date().toISOString(),
    callbackSummary: body
  });

  let reviewResult = null;
  if (String(notifyAgent).toLowerCase() === "manager") {
    reviewResult = addReviewItemForTask(taskId);
  }

  logCallbackEvent(notifyAgent, {
    event: "task_completion_callback_sent",
    taskId: task.id,
    workerAgent: task.agentName,
    notifyAgent,
    callbackMessageId: message.id,
    reviewCreated: Boolean(reviewResult && reviewResult.ok)
  });

  return {
    ok: true,
    message: `Completion callback sent for task "${taskId}" to "${notifyAgent}".`,
    task: updatedTask,
    callbackMessage: message,
    reviewResult
  };
}

function getTaskCallbackStatus(taskId) {
  const task = getTaskById(taskId);

  if (!task) {
    return {
      ok: false,
      message: `Task not found: ${taskId}`
    };
  }

  return {
    ok: true,
    message: "Task callback state loaded.",
    task
  };
}

function listTasksWithCallbacks() {
  return listTasks().filter((task) => task.callback && task.callback.enabled);
}

module.exports = {
  sendTaskCompletionCallback,
  getTaskCallbackStatus,
  listTasksWithCallbacks
};