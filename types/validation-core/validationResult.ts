import type { ValidatorName, ValidatorResult } from "./validatorResult";

export type ValidationStatus =
  | "approved"
  | "denied"
  | "invalid"
  | "disputed"
  | "quarantined"
  | "revalidation-required";

export type ValidationTimelineResult = Readonly<{
  validationId: string;
  status: ValidationStatus;
  deterministic: boolean;
  timelineId: string;
  reconstructedStateHash: string;
  validators: Record<ValidatorName, ValidatorResult>;
  generatedAt: string;
  resultHash: string;
}>;
