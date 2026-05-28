"use strict";

const TRANSITIONS = Object.freeze({
  __start__: {
    CREATE_REQUEST: "REQUESTED",
  },
  REQUESTED: {
    MARK_PREVIEWED: "PREVIEWED",
    MARK_AWAITING_APPROVAL: "AWAITING_APPROVAL",
    MARK_BLOCKED: "BLOCKED",
    FAIL: "FAILED",
    CANCEL: "CANCELLED",
  },
  PREVIEWED: {
    COMMIT_SUCCESS: "COMMITTED",
    COMMIT_BLOCK: "BLOCKED",
    FAIL: "FAILED",
    CANCEL: "CANCELLED",
  },
  AWAITING_APPROVAL: {
    APPROVE: "APPROVED",
    COMMIT_BLOCK: "BLOCKED",
    FAIL: "FAILED",
    CANCEL: "CANCELLED",
  },
  APPROVED: {
    COMMIT_SUCCESS: "COMMITTED",
    COMMIT_BLOCK: "BLOCKED",
    FAIL: "FAILED",
    CANCEL: "CANCELLED",
  },
});

function transitionState(currentState, event) {
  const normalizedState = currentState == null ? "__start__" : String(currentState || "").trim();
  const normalizedEvent = String(event || "").trim();
  const nextState = TRANSITIONS[normalizedState]?.[normalizedEvent] || null;
  if (!nextState) {
    return {
      ok: false,
      error: "BLOCKED_UNSAFE_RECOVERY",
      message: `Invalid recovery lifecycle transition from ${normalizedState} via ${normalizedEvent}.`,
    };
  }
  return {
    ok: true,
    data: {
      state: nextState,
    },
  };
}

module.exports = {
  transitionState,
};
