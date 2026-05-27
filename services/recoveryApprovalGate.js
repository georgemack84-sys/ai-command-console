"use strict";

const APPROVAL_REQUIRED = new Set([
  "REQUIRES_OPERATOR",
  "UNSAFE_REPLAY",
  "CORRUPTED",
  "UNKNOWN",
]);

function requiresApproval(classification) {
  return APPROVAL_REQUIRED.has(String(classification || "").trim().toUpperCase());
}

function validateApproval({ request, approvedBy }) {
  const approver = String(approvedBy || "").trim();
  if (!request || typeof request !== "object" || !String(request.recoveryRequestId || "").trim()) {
    return { ok: false, error: "BLOCKED_UNSAFE_RECOVERY", message: "Recovery request is required for approval." };
  }
  if (request.status !== "AWAITING_APPROVAL") {
    return { ok: false, error: "BLOCKED_UNSAFE_RECOVERY", message: "Recovery request is not awaiting approval." };
  }
  if (!request.policy?.requiresApproval) {
    return { ok: false, error: "BLOCKED_UNSAFE_RECOVERY", message: "Recovery request does not require approval." };
  }
  if (!approver) {
    return { ok: false, error: "BLOCKED_UNSAFE_RECOVERY", message: "Approver identity is required." };
  }
  return {
    ok: true,
    data: {
      recoveryRequestId: String(request.recoveryRequestId),
      approvedBy: approver,
    },
  };
}

module.exports = {
  requiresApproval,
  validateApproval,
};
