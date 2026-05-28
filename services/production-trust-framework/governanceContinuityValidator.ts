import { hashFailurePayload } from "@/services/failure-orchestration";
import {
  PRODUCTION_TRUST_ERROR_CODES,
  type GovernanceContinuityValidationResult,
  type ProductionTrustError,
} from "./productionTrustTypes";

export function validateGovernanceContinuity(input: {
  governanceHash: string;
  governanceEntries: readonly string[];
  approvalChainHash?: string;
  policyMutationDetected?: boolean;
  bypassDetected?: boolean;
  unknownAuthority?: boolean;
  directRuntimeAuthorization?: boolean;
}): GovernanceContinuityValidationResult {
  const errors: ProductionTrustError[] = [];
  if (input.governanceEntries.length === 0) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.TOOL_GOVERNANCE_METADATA_MISSING,
      message: "governance metadata is missing",
      path: "snapshot.content.governance",
    });
  }
  if (!input.approvalChainHash) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.TOOL_GOVERNANCE_METADATA_MISSING,
      message: "approval chain is missing",
      path: "approvalChainHash",
    });
  }
  if (input.policyMutationDetected) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.TOOL_POLICY_INVALID,
      message: "policy mutation detected",
      path: "policyMutationDetected",
    });
  }
  if (input.bypassDetected) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.GOVERNANCE_BYPASS_DETECTED,
      message: "governance bypass detected",
      path: "bypassDetected",
    });
  }
  if (input.unknownAuthority) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.CERTIFICATION_AUTHORITY_UNKNOWN,
      message: "unknown governance authority",
      path: "unknownAuthority",
    });
  }
  if (input.directRuntimeAuthorization) {
    errors.push({
      code: PRODUCTION_TRUST_ERROR_CODES.GOVERNANCE_BYPASS_DETECTED,
      message: "direct runtime authorization is forbidden",
      path: "directRuntimeAuthorization",
    });
  }

  return {
    valid: errors.length === 0,
    governanceHash: hashFailurePayload("EVIDENCE_BUNDLE", {
      governanceHash: input.governanceHash,
      approvalChainHash: input.approvalChainHash ?? null,
      governanceEntries: [...input.governanceEntries].sort(),
    }),
    errors,
  };
}
