const path = require("path");
const fs = require("fs");
const {
  getMessage,
  markMessageConverted,
  addMessageActionNote,
  listInbox
} = require("./inbox");
const { addTask } = require("./taskQueue");
const { getRuntimeLogPath } = require("./runtimePaths");

const AGENT_LOG_DIR = getRuntimeLogPath("agents");

function ensureLogDir() {
  fs.mkdirSync(AGENT_LOG_DIR, { recursive: true });
}

function logActionEvent(agentName, payload) {
  ensureLogDir();
  const safeAgentName = String(agentName || "system").trim().toLowerCase() || "system";
  const logPath = path.join(AGENT_LOG_DIR, `${safeAgentName}.log`);
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    inboxActionEvent: true,
    ...payload
  });
  fs.appendFileSync(logPath, line + "\n", "utf8");
}

function getMessageTaskStatus(agentName, messageId) {
  const message = getMessage(agentName, messageId);

  if (!message) {
    return {
      ok: false,
      message: `Message not found: ${messageId}`
    };
  }

  return {
    ok: true,
    message: "Message action state loaded.",
    actionState: message.actionState || null,
    originalMessage: message
  };
}

function convertMessageToTask(agentName, messageId) {
  const message = getMessage(agentName, messageId);

  if (!message) {
    return {
      ok: false,
      message: `Message not found: ${messageId}`
    };
  }

  if (message.actionState && message.actionState.convertedToTask) {
    return {
      ok: false,
      message: `Message "${messageId}" has already been converted to task "${message.actionState.taskId}".`,
      actionState: message.actionState
    };
  }

  const task = addTask(agentName, message.body, {
    sourceAgent: message.fromAgent || "unknown",
    priority: 2,
    delegationReason: `Created from inbox message ${message.id}.`,
    tags: ["message-driven", "inbox-converted"]
  });

  const updated = markMessageConverted(
    agentName,
    messageId,
    task.id,
    agentName,
    "task_created"
  );

  addMessageActionNote(
    agentName,
    messageId,
    `Converted inbox message to task ${task.id} for agent ${agentName}.`
  );

  logActionEvent(agentName, {
    event: "message_converted_to_task",
    messageId,
    taskId: task.id,
    fromAgent: message.fromAgent,
    toAgent: agentName
  });

  return {
    ok: true,
    message: `Message "${messageId}" converted to task "${task.id}".`,
    task,
    updatedMessage: updated
  };
}

function autoConvertMessage(messageId) {
  const inboxOwners = ["manager", "planner", "builder", "researcher"];

  for (const agentName of inboxOwners) {
    const found = getMessage(agentName, messageId);
    if (!found) {
      continue;
    }

    let targetAgent = agentName;
    let priority = 2;
    let tags = ["message-driven", "auto-converted"];
    let actionType = "auto_task_created";

    if (agentName === "manager") {
      const body = String(found.body || "").toLowerCase();

      if (/plan|roadmap|outline|break|steps|sequence/.test(body)) {
        targetAgent = "planner";
      } else if (/build|implement|code|service|runtime|feature|cli|ui|dashboard/.test(body)) {
        targetAgent = "builder";
      } else {
        targetAgent = "researcher";
      }

      priority = 1;
      tags.push("manager-escalation");
      actionType = "manager_escalation_routed";
    }

    if (found.actionState && found.actionState.convertedToTask) {
      return {
        ok: false,
        message: `Message "${messageId}" has already been converted to task "${found.actionState.taskId}".`,
        actionState: found.actionState
      };
    }

    const task = addTask(targetAgent, found.body, {
      sourceAgent: found.fromAgent || "unknown",
      priority,
      delegationReason: `Auto-created from inbox message ${found.id}.`,
      tags
    });

    const updated = markMessageConverted(
      agentName,
      messageId,
      task.id,
      targetAgent,
      actionType
    );

    addMessageActionNote(
      agentName,
      messageId,
      `Auto-converted message to task ${task.id} targeting ${targetAgent}.`
    );

    logActionEvent(agentName, {
      event: "message_auto_converted_to_task",
      originalInboxAgent: agentName,
      targetAgent,
      messageId,
      taskId: task.id,
      fromAgent: found.fromAgent
    });

    return {
      ok: true,
      message: `Message "${messageId}" auto-converted to task "${task.id}" for "${targetAgent}".`,
      task,
      updatedMessage: updated,
      targetAgent
    };
  }

  return {
    ok: false,
    message: `Message not found in known inboxes: ${messageId}`
  };
}

function listManagerEscalations() {
  const messages = listInbox("manager");
  return messages.filter((message) => {
    const from = String(message.fromAgent || "").toLowerCase();
    return from && from !== "manager";
  });
}

module.exports = {
  getMessageTaskStatus,
  convertMessageToTask,
  autoConvertMessage,
  listManagerEscalations
};
