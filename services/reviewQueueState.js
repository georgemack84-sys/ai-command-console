function createDefaultReviewState() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  };
}

function normalizeReviewState(state = {}) {
  return {
    createdAt: state.createdAt || new Date().toISOString(),
    items: Array.isArray(state.items) ? state.items : [],
  };
}

function buildReviewItem(task) {
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
      sentAt: null,
    },
    createdAt: new Date().toISOString(),
    reviewedAt: null,
  };
}

function buildReviewReply(replyType, messageId) {
  return {
    sent: true,
    replyType: replyType || null,
    messageId: messageId || null,
    sentAt: new Date().toISOString(),
  };
}

module.exports = {
  createDefaultReviewState,
  normalizeReviewState,
  buildReviewItem,
  buildReviewReply,
};
