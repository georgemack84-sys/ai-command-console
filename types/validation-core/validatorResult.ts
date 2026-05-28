export type ValidatorName =
  | "schema"
  | "dependency"
  | "capability"
  | "governance"
  | "replay"
  | "rollback"
  | "runtime"
  | "isolation"
  | "integrity";

export type ValidatorResultStatus =
  | "passed"
  | "failed"
  | "denied"
  | "disputed"
  | "revalidation-required";

export type ValidatorResult = Readonly<{
  validator: ValidatorName;
  status: ValidatorResultStatus;
  passed: boolean;
  failureCode?: string;
  evidence: readonly string[];
  hash: string;
}>;
