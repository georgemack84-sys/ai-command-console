import type { ZodTypeAny } from "zod";

export type ContractKind = "request" | "response" | "event" | "protocol";
export type ContractRiskLevel = "low" | "medium" | "high" | "critical";

export type ContractGovernanceMetadata = {
  approved: boolean;
  approvedBy?: string;
  riskLevel: ContractRiskLevel;
  replayVerified?: boolean;
  compatibilityVerified?: boolean;
  published?: boolean;
};

export type ContractDefinitionInput = {
  id: string;
  version: string;
  kind: ContractKind;
  owner: string;
  schema: ZodTypeAny;
  governance: ContractGovernanceMetadata;
  deprecated?: boolean;
  deprecatedSince?: string;
  sunsetAt?: string;
  migrationTargetVersion?: string;
  metadata?: Record<string, unknown>;
};

export type ContractDefinition = ContractDefinitionInput & {
  hash: string;
  publishedAt?: string;
};

export type ContractValidationSuccess<T> = {
  ok: true;
  data: T;
};

export type ContractValidationFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ContractValidationResult<T> = ContractValidationSuccess<T> | ContractValidationFailure;

export type CompatibilityChange =
  | { type: "add_optional_field"; field: string }
  | { type: "add_enum_value"; field: string }
  | { type: "remove_required_field"; field: string }
  | { type: "rename_field"; field: string; nextField: string }
  | { type: "type_change"; field: string }
  | { type: "semantic_change"; field: string };

export type ContractCompatibilityResult = {
  compatible: boolean;
  code?: string;
  reason?: string;
  requiresMajorVersionBump: boolean;
};
