const fs = require("fs");
const path = require("path");
const { sendMessage } = require("./inbox");

const AGENT_LOG_DIR = path.join(process.cwd(), "logs", "agents");

function ensureLogDir() {
  fs.mkdirSync(AGENT_LOG_DIR, { recursive: true });
}

function logReviewReplyEvent(payload) {
  ensureLogDir();
  const logPath = path.join(AGENT_LOG_DIR, "manager.log");
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    reviewReplyEvent: true,
    ...payload
  });
  fs.appendFileSync(logPath, line + "\n", "utf8");
}

function buildApprovalMessage(item) {
  return [
    `Manager review result: approved.`,
    `Task ID: ${item.taskId}`,
    `Task: ${item.taskDescription || "(no description)"}`,
    `Decision Note: ${item.decisionNote || "Manager approved completed work."}`
  ].join(" ");
}

function buildRevisionMessage(item) {
  return [
    `Manager review result: revision requested.`,
    `Task ID: ${item.taskId}`,
    `Task: ${item.taskDescription || "(no description)"}`,
    `Decision Note: ${item.decisionNote || "Manager requested revision."}`
  ].join(" ");
}

function buildFollowupMessage(item, followupTaskId) {
  return [
    `Manager review result: follow-up task created.`,
    `Original Task ID: ${item.taskId}`,
    `Follow-up Task ID: ${followupTaskId || item.followupTaskId || "(none)"}`,
    `Task: ${item.taskDescription || "(no description)"}`,
    `Decision Note: ${item.decisionNote || "Manager created a follow-up task."}`
  ].join(" ");
}

function sendReviewReply(item, replyType, followupTaskId = null) {
  if (!item) {
    return {
      ok: false,
      message: "Review item is required."
    };
  }

  const targetAgent = item.agentName;
  if (!targetAgent) {
    return {
      ok: false,
      message: `Review item for task "${item.taskId}" has no target agent.`
    };
  }

  let body = "";
  if (replyType === "approved") {
    body = buildApprovalMessage(item);
  } else if (replyType === "revise") {
    body = buildRevisionMessage(item);
  } else if (replyType === "followup_created") {
    body = buildFollowupMessage(item, followupTaskId);
  } else {
    return {
      ok: false,
      message: `Unsupported reply type: ${replyType}`
    };
  }

  const message = sendMessage("manager", targetAgent, body);

  logReviewReplyEvent({
    event: "review_reply_sent",
    replyType,
    taskId: item.taskId,
    targetAgent,
    messageId: message.id,
    followupTaskId: followupTaskId || null
  });

  return {
    ok: true,
    message: `Review reply sent to "${targetAgent}" for task "${item.taskId}".`,
    replyMessage: message,
    replyType
  };
}

module.exports = {
  sendReviewReply
};