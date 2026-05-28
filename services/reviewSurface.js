const path = require("path");
const {
  appendAuditEvents,
  loadExecutionState,
  resolveReviewRecords,
  upsertReviewRecords,
} = require("./executionStateStore");
const {
  LEARNING_STATE_KEY,
  LEARNING_STATE_PATH,
  defaultLearningState,
  loadLearningState,
  saveLearningState,
  recordLearningEvent,
  setLearningMode,
  resetLearningState,
} = require("./learningAdvisory");
const { loadDocument, saveDocument } = require("./stateDatabase");
const { getAgentsDataPath } = require("./runtimePaths");

const REVIEW_SURFACE_KEY = "execution-review-surface";
const REVIEW_SURFACE_PATH = getAgentsDataPath("execution-review-surface.json");

function defaultReviewSurfaceState() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviews: [],
  };
}

function loadReviewSurfaceState() {
  return loadDocument(REVIEW_SURFACE_KEY, defaultReviewSurfaceState, {
    legacyPath: REVIEW_SURFACE_PATH,
  });
}

function saveReviewSurfaceState(value) {
  return saveDocument(REVIEW_SURFACE_KEY, value, {
    legacyPath: REVIEW_SURFACE_PATH,
  });
}

function createReviewStep(step = {}, executionMode = "blocked", reasonFlagged = "", suggestedAlternative = "") {
  const declaredSideEffects = Array.isArray(step.declaredSideEffects) ? step.declaredSideEffects : [];
  const riskLevel = step.riskScore >= 75 ? "high" : step.riskScore >= 35 ? "medium" : "low";
  return {
    stepId: String(step.id || ""),
    intent: String(step.description || step.action || step.tool || "step"),
    commandPreview: `${String(step.tool || step.action || "step")} ${JSON.stringify(step.payload ?? step.command ?? "")}`.trim(),
    riskLevel,
    executionMode,
    ...(reasonFlagged ? { reasonFlagged } : {}),
    ...(suggestedAlternative ? { suggestedAlternative } : {}),
    declaredSideEffects,
  };
}

function createReviewRecord(runId, steps = [], executionMode = "blocked", options = {}) {
  return {
    id: String(options.id || `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
    runId: String(runId),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: options.status || "pending",
    originalRequest: String(options.originalRequest || ""),
    reviewStatus: String(options.reviewStatus || options.status || "pending"),
    reviewMode: String(options.reviewMode || "standard"),
    reviewModeReason: String(options.reviewModeReason || ""),
    summary: options.summary || null,
    deltaAnalysis: options.deltaAnalysis || null,
    operatorPatternInsights: options.operatorPatternInsights || null,
    recommendation: options.recommendation || null,
    attentionPoints: Array.isArray(options.attentionPoints) ? options.attentionPoints : [],
    currentStage: options.currentStage || null,
    pendingReviews: Array.isArray(options.pendingReviews) ? options.pendingReviews : [],
    steps: steps.map((step) =>
      createReviewStep(
        step,
        executionMode,
        options.reasonFlagged || "",
        options.suggestedAlternative || ""
      )
    ),
  };
}

function stageReview(runId, steps = [], executionMode = "blocked", options = {}) {
  const state = loadReviewSurfaceState();
  const review = createReviewRecord(runId, steps, executionMode, options);

  const next = {
    ...state,
    updatedAt: new Date().toISOString(),
    reviews: [
      review,
      ...(Array.isArray(state.reviews) ? state.reviews : []),
    ],
  };
  saveReviewSurfaceState(next);
  upsertReviewRecords(review);
  appendAuditEvents([
    {
      executionId: review.runId,
      eventType: "review.requested",
      createdAt: review.updatedAt,
      payload: {
        reviewMode: review.reviewMode,
        stepCount: review.steps.length,
      },
    },
  ]);
  return review;
}

function resolveReview(runId, status = "resolved") {
  const state = loadReviewSurfaceState();
  const normalizedStatus = String(status || "").toLowerCase();
  const next = {
    ...state,
    updatedAt: new Date().toISOString(),
    reviews: (state.reviews || []).map((review) =>
      review.runId === String(runId) && review.status === "pending"
        ? { ...review, status, updatedAt: new Date().toISOString() }
        : review
    ),
  };
  saveReviewSurfaceState(next);
  const resolved = [...next.reviews].reverse().find((review) => review.runId === String(runId)) || null;
  if (!resolved) {
    return null;
  }

  let reviewAction = null;
  let eventType = null;
  let operatorModified = false;
  if (["approved", "simulated", "resolved"].includes(normalizedStatus)) {
    reviewAction = "approve";
    eventType = "review.approved";
  } else if (["modified", "rewritten"].includes(normalizedStatus)) {
    reviewAction = "approve_with_edit";
    eventType = "review.modified";
    operatorModified = true;
  } else if (["blocked", "rejected"].includes(normalizedStatus)) {
    reviewAction = "block";
    eventType = "review.rejected";
  } else if (normalizedStatus === "deferred") {
    reviewAction = "defer";
    eventType = "review.rejected";
  } else if (normalizedStatus === "cancelled") {
    reviewAction = "cancel_execution";
    eventType = "review.rejected";
  }

  if (reviewAction && eventType) {
    resolveReviewRecords(runId, {
      reviewAction,
      reviewedBy: "system",
      reviewedAt: resolved.updatedAt,
      operatorModified,
      finalText: resolved.summary || null,
    });
    appendAuditEvents([
      {
        executionId: resolved.runId,
        eventType,
        createdAt: resolved.updatedAt,
        payload: {
          status: normalizedStatus,
          operatorModified,
        },
      },
    ]);
  }

  return resolved;
}

function listPendingReviews() {
  return (loadReviewSurfaceState().reviews || []).filter((review) => review.status === "pending");
}

function getReviewSurface(planId) {
  const executionState = loadExecutionState(planId);
  const pendingStateReviews = (loadReviewSurfaceState().reviews || []).filter(
    (review) => review.runId === String(planId) && review.status === "pending"
  );
  const currentStage = (executionState.stages || []).find((stage) =>
    ["running", "paused_for_review", "pending"].includes(String(stage.status || ""))
  ) || null;
  const pendingReviews = (executionState.steps || [])
    .filter((step) => {
      if (currentStage && step.stageId !== currentStage.id) {
        return false;
      }
      const terminal = ["completed", "failed", "cancelled"].includes(String(step.status || ""));
      if (terminal && !step.blockReason && !step.deferred) {
        return false;
      }
      return Boolean(
        (step.rewriteReason && !step.reviewAcknowledged) ||
        step.deferred ||
        step.blockReason ||
        (step.pauseReason && !terminal) ||
        step.requiresReview ||
        step.status === "paused_for_review"
      );
    })
    .map((step) => ({
      step_id: step.id,
      issue_type: step.blockReason
        ? "blocked"
        : step.deferred
          ? "deferred"
          : step.rewriteReason
            ? "rewrite"
            : "risk",
      explanation: step.blockReason || step.pauseReason || step.rewriteReason || step.normalizationNote || "Review required.",
      suggested_action: step.blockReason
        ? "reject"
        : step.rewriteReason
          ? "modify"
          : "approve",
    }));

  return {
    plan_id: String(planId),
    current_stage: currentStage
      ? {
        id: currentStage.id,
        name: currentStage.name,
        status: currentStage.status,
      }
      : null,
    pending_reviews: pendingReviews.length
      ? pendingReviews
      : pendingStateReviews.flatMap((review) =>
        (review.steps || []).map((step) => ({
          step_id: step.stepId,
          issue_type: step.reasonFlagged === "confirm_required" ? "risk" : "rewrite",
          explanation: step.reasonFlagged || "Review required.",
          suggested_action: step.suggestedAlternative ? "modify" : "approve",
        }))
      ),
  };
}

module.exports = {
  REVIEW_SURFACE_KEY,
  REVIEW_SURFACE_PATH,
  LEARNING_STATE_KEY,
  LEARNING_STATE_PATH,
  defaultReviewSurfaceState,
  defaultLearningState,
  loadReviewSurfaceState,
  saveReviewSurfaceState,
  loadLearningState,
  saveLearningState,
  createReviewStep,
  createReviewRecord,
  recordLearningEvent,
  setLearningMode,
  resetLearningState,
  stageReview,
  resolveReview,
  listPendingReviews,
  getReviewSurface,
};
