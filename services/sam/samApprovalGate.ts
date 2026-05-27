import { SAM_READ_ONLY_ACTIONS } from "./samConstants";
import { SAM_ERROR_CODES } from "./samErrors";
import type { SamActionType, SamApprovalResult, SamApprovalStatus } from "./samTypes";

export function evaluateSamApproval({
  actionType,
  requireApproval,
  approval,
}: {
  actionType: SamActionType;
  requireApproval: boolean;
  approval?: {
    status: SamApprovalStatus;
    approvedBy?: string;
    reason?: string;
  };
}): SamApprovalResult {
  if (SAM_READ_ONLY_ACTIONS.includes(actionType) && approval?.status === "not_applicable") {
    return {
      required: false,
      granted: true,
      denied: false,
      status: "not_applicable",
      approvedBy: approval.approvedBy,
      reason: approval.reason,
    };
  }

  if (!requireApproval) {
    return {
      required: false,
      granted: true,
      denied: false,
      status: "granted",
      approvedBy: approval?.approvedBy,
      reason: approval?.reason,
    };
  }

  if (!approval || approval.status === "required") {
    return {
      required: true,
      granted: false,
      denied: false,
      status: "required",
      reason: SAM_ERROR_CODES.SAM_APPROVAL_REQUIRED,
    };
  }

  if (approval.status === "denied") {
    return {
      required: true,
      granted: false,
      denied: true,
      status: "denied",
      approvedBy: approval.approvedBy,
      reason: SAM_ERROR_CODES.SAM_APPROVAL_DENIED,
    };
  }

  if (approval.status === "granted") {
    return {
      required: true,
      granted: true,
      denied: false,
      status: "granted",
      approvedBy: approval.approvedBy,
      reason: approval.reason,
    };
  }

  return {
    required: true,
    granted: false,
    denied: false,
    status: "required",
    reason: SAM_ERROR_CODES.SAM_APPROVAL_REQUIRED,
  };
}
