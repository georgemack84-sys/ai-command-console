"use strict";

const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;

function shouldThrottleAutomation({ executionId, signalType, recommendation, history = [], now = Date.now() }) {
  const relevant = Array.isArray(history)
    ? history.find((event) =>
        String(event?.payload?.executionId || "") === String(executionId || "")
        && String(event?.payload?.signalType || "") === String(signalType || "")
        && String(event?.payload?.recommendation || "") === String(recommendation || "")
      )
    : null;

  if (!relevant) {
    return {
      throttled: false,
      reason: "eligible",
      nextEligibleAt: null,
    };
  }

  const eventTime = Date.parse(String(relevant.timestamp || ""));
  if (!Number.isFinite(eventTime)) {
    return {
      throttled: true,
      reason: "invalid_history_timestamp",
      nextEligibleAt: null,
    };
  }

  const nextEligibleAtMs = eventTime + DEFAULT_COOLDOWN_MS;
  if (Number(now) < nextEligibleAtMs) {
    return {
      throttled: true,
      reason: "cooldown_active",
      nextEligibleAt: new Date(nextEligibleAtMs).toISOString(),
    };
  }

  return {
    throttled: false,
    reason: "eligible",
    nextEligibleAt: null,
  };
}

module.exports = {
  DEFAULT_COOLDOWN_MS,
  shouldThrottleAutomation,
};
