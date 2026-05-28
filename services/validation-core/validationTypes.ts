import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type {
  EventIntegrityRecord,
  ValidationCoreErrorCode,
  ValidationDebugEvent,
  ValidationRequest,
  ValidationStatus,
  ValidationTimeline,
  ValidationTimelineResult,
  ValidatorName,
  ValidatorResult,
  ValidatorResultStatus,
} from "@/types/validation-core";

export type ValidationTarget = Readonly<{
  request: ValidationRequest;
  treaty: ExecutionTreatyPackage;
}>;

export type ValidationFailure = Readonly<{
  code: ValidationCoreErrorCode;
  message: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
}>;

export type ValidationContext = Readonly<{
  request: ValidationRequest;
  treaty: ExecutionTreatyPackage;
}>;

export type ValidationForensics = Readonly<{
  validationId: string;
  summary: string;
  failedValidator?: ValidatorName;
  failureCode?: ValidationCoreErrorCode;
  explanationHash: string;
  evidence: readonly string[];
}>;

export type ValidationPipelineOutput = Readonly<{
  result: ValidationTimelineResult;
  timeline: ValidationTimeline;
  events: readonly ValidationDebugEvent[];
  eventIntegrity: readonly EventIntegrityRecord[];
  forensics: ValidationForensics;
}>;

export type ValidatorImplementation = (
  context: ValidationContext,
) => {
  result: ValidatorResult;
  failures: readonly ValidationFailure[];
};

export type ValidatorDefinition = Readonly<{
  name: ValidatorName;
  subsystem: string;
  implementation: ValidatorImplementation;
}>;

export type ValidationLedger = Readonly<{
  events: readonly ValidationDebugEvent[];
}>;

export type ValidationState = Readonly<{
  status: ValidationStatus;
  validators: Partial<Record<ValidatorName, ValidatorResult>>;
  failures: readonly ValidationFailure[];
  eventCount: number;
}>;

export type ValidatorStatusInput = Readonly<{
  status: ValidatorResultStatus;
  failureCode?: string;
}>;
