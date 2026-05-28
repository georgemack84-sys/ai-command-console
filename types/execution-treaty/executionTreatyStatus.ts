export type ExecutionTreatyTrustZone = "controlled" | "restricted" | "quarantined";

export type ExecutionTreatyHandoffStatus =
  | "ready"
  | "revalidation-required"
  | "revoked"
  | "quarantined";

export type ExecutionTreatyPreExecutionRevocationStatus =
  | "still_admissible"
  | "must_revalidate"
  | "revoked"
  | "quarantined";
