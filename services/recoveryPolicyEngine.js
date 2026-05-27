"use strict";

const POLICY_BY_CLASSIFICATION = Object.freeze({
  SAFE_REPLAY: { allowed: true, requiresApproval: false, reason: "safe_replay", policyCode: "SAFE_REPLAY" },
  IDEMPOTENT_REPLAY: { allowed: true, requiresApproval: false, reason: "idempotent_replay", policyCode: "IDEMPOTENT_REPLAY" },
  REQUIRES_OPERATOR: { allowed: true, requiresApproval: true, reason: "requires_operator", policyCode: "REQUIRES_OPERATOR" },
  UNSAFE_REPLAY: { allowed: true, requiresApproval: true, reason: "unsafe_replay", policyCode: "UNSAFE_REPLAY" },
  CORRUPTED: { allowed: true, requiresApproval: true, reason: "corrupted", policyCode: "CORRUPTED" },
});

function selectClassification(preview = {}) {
  const candidates = Array.isArray(preview.replayCandidates) ? preview.replayCandidates : [];
  const ordered = ["CORRUPTED", "UNSAFE_REPLAY", "REQUIRES_OPERATOR", "IDEMPOTENT_REPLAY", "SAFE_REPLAY"];
  for (const classification of ordered) {
    if (candidates.some((candidate) => String(candidate?.classification || "") === classification)) {
      return classification;
    }
  }
  return candidates.length === 0 ? "SAFE_REPLAY" : "UNKNOWN";
}

function evaluateRecoveryPolicy({ plan, preview, modes, requestedBy }) {
  void plan;
  void modes;
  void requestedBy;

  const classification = selectClassification(preview);
  return POLICY_BY_CLASSIFICATION[classification] || {
    allowed: false,
    requiresApproval: false,
    reason: "unknown_classification",
    policyCode: "BLOCKED_UNSAFE_RECOVERY",
  };
}

module.exports = {
  evaluateRecoveryPolicy,
};
