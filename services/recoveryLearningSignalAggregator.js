"use strict";

function failure(message) {
  return {
    ok: false,
    error: "BLOCKED_UNSAFE_RECOVERY_LEARNING",
    message: String(message || "Recovery learning signal aggregation blocked."),
  };
}

function success(data) {
  return { ok: true, data };
}

function ensureArray(value, name) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${name} must be an array.`);
  }
  return value;
}

function incrementCounter(map, key, field) {
  if (!map[key]) {
    map[key] = {
      total: 0,
      verified: 0,
      failed: 0,
      unknown: 0,
      partial: 0,
      noMutationConfirmed: 0,
    };
  }
  map[key].total += 1;
  if (field && Object.prototype.hasOwnProperty.call(map[key], field)) {
    map[key][field] += 1;
  }
}

function outcomeToField(outcome) {
  switch (String(outcome || "").trim().toUpperCase()) {
    case "VERIFIED":
      return "verified";
    case "FAILED":
      return "failed";
    case "UNKNOWN":
      return "unknown";
    case "PARTIAL":
      return "partial";
    case "NO_MUTATION_CONFIRMED":
      return "noMutationConfirmed";
    default:
      return null;
  }
}

function aggregateRecoveryLearningSignals({
  verificationEvents,
  executionEvents,
  advisoryEvents,
  automationEvents,
  autonomyEvents,
} = {}) {
  try {
    const normalizedVerificationEvents = ensureArray(verificationEvents, "verificationEvents");
    const normalizedExecutionEvents = ensureArray(executionEvents, "executionEvents");
    const normalizedAdvisoryEvents = ensureArray(advisoryEvents, "advisoryEvents");
    const normalizedAutomationEvents = ensureArray(automationEvents, "automationEvents");
    const normalizedAutonomyEvents = ensureArray(autonomyEvents, "autonomyEvents");

    const totals = {
      verified: 0,
      failed: 0,
      unknown: 0,
      partial: 0,
      noMutationConfirmed: 0,
    };
    const byRecoveryMode = {};
    const bySignalType = {};
    const byClassification = {};
    const warnings = [];

    if (normalizedVerificationEvents.length === 0) {
      warnings.push("missing_verification_history");
    }
    if (normalizedExecutionEvents.length === 0) {
      warnings.push("missing_execution_history");
    }
    if (normalizedAdvisoryEvents.length === 0) {
      warnings.push("missing_advisory_history");
    }
    if (normalizedAutomationEvents.length === 0) {
      warnings.push("missing_automation_history");
    }
    if (normalizedAutonomyEvents.length === 0) {
      warnings.push("missing_autonomy_history");
    }

    for (const event of normalizedVerificationEvents) {
      const payload = event?.payload || {};
      const verification = payload.verification || {};
      const outcomeField = outcomeToField(verification.outcome);
      if (outcomeField) {
        totals[outcomeField] += 1;
      }

      const recoveryMode = String(payload.recoveryMode || payload.result?.recoveryMode || "").trim();
      if (recoveryMode) {
        incrementCounter(byRecoveryMode, recoveryMode, outcomeField);
      }
    }

    for (const event of normalizedAdvisoryEvents) {
      const payload = event?.payload || {};
      const signalType = String(
        payload?.candidate?.signalType
          || payload?.signal?.signalType
          || "",
      ).trim();
      if (signalType) {
        bySignalType[signalType] = (bySignalType[signalType] || 0) + 1;
      }

      const classification = String(
        payload?.classification
          || payload?.signal?.classification
          || payload?.recommendation?.classification
          || "",
      ).trim();
      if (classification) {
        byClassification[classification] = (byClassification[classification] || 0) + 1;
      }
    }

    return success({
      totals,
      byRecoveryMode,
      bySignalType,
      byClassification,
      warnings,
    });
  } catch (error) {
    return failure(error.message);
  }
}

module.exports = {
  aggregateRecoveryLearningSignals,
};
