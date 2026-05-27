"use strict";

function failure(message) {
  return {
    ok: false,
    error: "BLOCKED_UNSAFE_RECOVERY_LEARNING",
    message: String(message || "Recovery learning policy advice blocked."),
  };
}

function success(data) {
  return { ok: true, data };
}

function clampConfidence(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  if (numeric < 0) {
    return 0;
  }
  if (numeric > 1) {
    return 1;
  }
  return numeric;
}

function recommendRecoveryPolicyAdjustments({ learningSignals, modes = {} } = {}) {
  if (!learningSignals || typeof learningSignals !== "object" || Array.isArray(learningSignals)) {
    return failure("Learning signals are required.");
  }

  const totals = learningSignals.totals || {};
  const byRecoveryMode = learningSignals.byRecoveryMode || {};
  const recommendations = [];

  if (Number(totals.unknown || 0) >= 2) {
    recommendations.push({
      target: "advisory_policy",
      recommendation: "Review repeated unknown recovery outcomes and tighten manual-review policy.",
      severity: "HIGH",
      confidence: clampConfidence(0.65 + (Number(totals.unknown || 0) * 0.05)),
      reason: "repeated_unknown_outcomes_detected",
    });
  }

  if (Number(totals.failed || 0) >= 2) {
    recommendations.push({
      target: "autonomy_policy",
      recommendation: "Review autonomy boundaries and favor manual review for repeated failed recoveries.",
      severity: "HIGH",
      confidence: clampConfidence(0.7 + (Number(totals.failed || 0) * 0.04)),
      reason: "repeated_failed_recoveries_detected",
    });
  }

  const resumeStats = byRecoveryMode.resume || {};
  if (Number(resumeStats.verified || 0) >= 3 && Number(resumeStats.failed || 0) === 0 && Number(resumeStats.unknown || 0) === 0) {
    recommendations.push({
      target: "execution_policy",
      recommendation: "Review whether low-risk resume paths deserve future allowlist consideration under supervision.",
      severity: "LOW",
      confidence: clampConfidence(0.5 + (Number(resumeStats.verified || 0) * 0.05)),
      reason: "verified_low_risk_resume_pattern_detected",
    });
  }

  if (Number(totals.partial || 0) >= 2) {
    recommendations.push({
      target: "automation_throttle",
      recommendation: "Review cooldowns and escalation timing for repeated partial recovery outcomes.",
      severity: "MEDIUM",
      confidence: clampConfidence(0.55 + (Number(totals.partial || 0) * 0.05)),
      reason: "repeated_partial_recoveries_detected",
    });
  }

  if (modes && typeof modes === "object" && Array.isArray(modes?.learningWarnings) && modes.learningWarnings.length > 0) {
    recommendations.push({
      target: "advisory_policy",
      recommendation: "Review learning warnings before changing recovery policy.",
      severity: "LOW",
      confidence: 0.4,
      reason: "learning_warnings_present",
    });
  }

  return success({ recommendations });
}

module.exports = {
  recommendRecoveryPolicyAdjustments,
};
