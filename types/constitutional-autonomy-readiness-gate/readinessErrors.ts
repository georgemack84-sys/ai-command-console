export type ConstitutionalReadinessErrorCode =
  | "AUTONOMY_POLICY_DENIED"
  | "AUTONOMY_SCOPE_EXCEEDED"
  | "AUTONOMY_APPROVAL_REQUIRED"
  | "AUTONOMY_REPLAY_INVALID"
  | "AUTONOMY_RISK_TOO_HIGH"
  | "AUTONOMY_UNCERTAINTY_HIGH"
  | "AUTONOMY_EXECUTION_LIMIT"
  | "AUTONOMY_GOVERNANCE_MISMATCH"
  | "AUTONOMY_RUNTIME_UNSAFE"
  | "AUTONOMY_OPERATOR_OVERRIDE"
  | "AUTONOMY_READINESS_DRIFT";

export type ConstitutionalReadinessError = Readonly<{
  code: ConstitutionalReadinessErrorCode;
  message: string;
  path?: string;
}>;
