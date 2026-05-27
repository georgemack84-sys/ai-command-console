"use strict";

function clampScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1;
  }
  return Math.max(0, Math.min(1, numeric));
}

function getPrimaryClassification(recoveryRequest = {}) {
  const candidates = Array.isArray(recoveryRequest?.preview?.replayCandidates)
    ? recoveryRequest.preview.replayCandidates
    : [];
  const ordered = ["CORRUPTED", "UNKNOWN", "UNSAFE_REPLAY", "REQUIRES_OPERATOR", "IDEMPOTENT_REPLAY", "SAFE_REPLAY"];
  for (const classification of ordered) {
    if (candidates.some((candidate) => String(candidate?.classification || "") === classification)) {
      return classification;
    }
  }
  return "UNKNOWN";
}

function scoreRecoveryAutonomyRisk({ recoveryRequest, advisory, preview, policy }) {
  void preview;

  const classification = getPrimaryClassification(recoveryRequest);
  if (classification === "CORRUPTED") {
    return {
      riskLevel: "CRITICAL",
      score: 1,
      reasons: ["corrupted_recovery_candidate"],
    };
  }

  if (classification === "UNKNOWN") {
    return {
      riskLevel: "UNKNOWN",
      score: 1,
      reasons: ["unknown_recovery_evidence"],
    };
  }

  let score = 0.5;
  const reasons = [];

  if (classification === "SAFE_REPLAY") {
    score -= 0.35;
    reasons.push("safe_replay_candidate");
  } else if (classification === "IDEMPOTENT_REPLAY") {
    score -= 0.25;
    reasons.push("idempotent_replay_candidate");
  } else if (classification === "REQUIRES_OPERATOR") {
    score += 0.25;
    reasons.push("operator_required_classification");
  } else if (classification === "UNSAFE_REPLAY") {
    score += 0.35;
    reasons.push("unsafe_replay_candidate");
  }

  const confidenceRaw = advisory?.recommendation?.confidence;
  const confidence = Number(confidenceRaw);
  if (Number.isFinite(confidence) && confidence >= 0.95) {
    score -= 0.15;
    reasons.push("high_recommendation_confidence");
  } else if (Number.isFinite(confidence) && confidence < 0.8) {
    score += 0.15;
    reasons.push("low_recommendation_confidence");
  }

  if (String(policy?.action || "") !== "auto_approve") {
    score += 0.2;
    reasons.push("policy_not_auto_approve");
  }

  score = clampScore(score);
  const riskLevel = score <= 0.25
    ? "LOW"
    : score <= 0.5
      ? "MEDIUM"
      : score <= 0.75
        ? "HIGH"
        : "CRITICAL";

  return {
    riskLevel,
    score,
    reasons,
  };
}

module.exports = {
  scoreRecoveryAutonomyRisk,
};
