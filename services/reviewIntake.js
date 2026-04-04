const path = require("path");
const fs = require("fs");
const {
  getMessage,
  acknowledgeReviewMessage,
  markReviewMessageTaskified,
  addReviewIntakeNote
} = require("./inbox");
const { addTask } = require("./taskQueue");

const AGENT_LOG_DIR = path.join(process.cwd(), "logs", "agents");

function ensureLogDir() {
  fs.mkdirSync(AGENT_LOG_DIR, { recursive: true });
}

function logReviewIntakeEvent(agentName, payload) {
  ensureLogDir();
  const safeAgentName = String(agentName || "system").trim().toLowerCase() || "system";
  const logPath = path.join(AGENT_LOG_DIR, `${safeAgentName}.log`);
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    reviewIntakeEvent: true,
    ...payload
  });
  fs.appendFileSync(logPath, line + "\n", "utf8");
}

function getReviewAckStatus(agentName, messageId) {
  const message = getMessage(agentName, messageId);

  if (!message) {
    return {
      ok: false,
      message: `Message not found: ${messageId}`
    };
  }

  return {
    ok: true,
    message: "Review intake state loaded.",
    reviewIntake: message.reviewIntake || null,
    originalMessage: message
  };
}

function acknowledgeReviewReply(agentName, messageId) {
  const message = getMessage(agentName, messageId);

  if (!message) {
    return {
      ok: false,
      message: `Message not found: ${messageId}`
    };
  }

  const updated = acknowledgeReviewMessage(agentName, messageId);
  addReviewIntakeNote(agentName, messageId, "Acknowledged manager review reply.");

  logReviewIntakeEvent(agentName, {
    event: "review_reply_acknowledged",
    messageId,
    fromAgent: message.fromAgent,
    toAgent: message.toAgent
  });

  return {
    ok: true,
    message: `Review reply "${messageId}" acknowledged by "${agentName}".`,
    updatedMessage: updated
  };
}

function determineReviewIntakeType(message) {
  const body = String(message?.body || "").toLowerCase();

  if (body.includes("revision requested")) {
    return "revision_request";
  }

  if (body.includes("follow-up task created")) {
    return "followup_notice";
  }

  if (body.includes("approved")) {
    return "approval_notice";
  }

  return "generic_review_reply";
}

function taskifyReviewReply(agentName, messageId) {
  const message = getMessage(agentName, messageId);

  if (!message) {
    return {
      ok: false,
      message: `Message not found: ${messageId}`
    };
  }

  const intake = message.reviewIntake || {};
  if (intake.taskified) {
    return {
      ok: false,
      message: `Review reply "${messageId}" has already been converted to task "${intake.intakeTaskId}".`,
      reviewIntake: intake
    };
  }

  const intakeType = determineReviewIntakeType(message);

  const task = addTask(agentName, message.body, {
    sourceAgent: "manager",
    priority: intakeType === "revision_request" ? 1 : 2,
    delegationReason: `Created from manager review reply message ${message.id}.`,
    tags: ["review-intake", intakeType],
    sourceMessageId: message.id,
    sourceInboxAgent: agentName,
    notifyAgent: "manager",
    callbackEnabled: true
  });

  const updated = markReviewMessageTaskified(
    agentName,
    messageId,
    task.id,
    agentName,
    intakeType
  );

  addReviewIntakeNote(
    agentName,
    messageId,
    `Review reply taskified into ${task.id} with intake type ${intakeType}.`
  );

  logReviewIntakeEvent(agentName, {
    event: "review_reply_taskified",
    messageId,
    taskId: task.id,
    intakeType,
    agentName
  });

  return {
    ok: true,
    message: `Review reply "${messageId}" converted to task "${task.id}".`,
    task,
    updatedMessage: updated
  };
}

function autoTaskifyReviewReply(messageId) {
  const inboxOwners = ["planner", "builder", "researcher", "manager"];

  for (const agentName of inboxOwners) {
    const found = getMessage(agentName, messageId);
    if (!found) continue;
    return taskifyReviewReply(agentName, messageId);
  }

  return {
    ok: false,
    message: `Review reply message not found: ${messageId}`
  };
}

module.exports = {
  getReviewAckStatus,
  acknowledgeReviewReply,
  taskifyReviewReply,
  autoTaskifyReviewReply
};