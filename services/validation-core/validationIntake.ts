import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { ValidationRequest, ValidationTargetType } from "@/types/validation-core";
import { hashExecutionTreatyValue } from "@/services/execution-treaty";

export type ValidationIntakeInput = Readonly<{
  targetType: ValidationTargetType;
  targetId?: string;
  submittedAt: string;
  treaty: ExecutionTreatyPackage;
  runtimeProfileId?: string;
}>;

export function createValidationRequest(input: ValidationIntakeInput): ValidationRequest {
  const targetId = input.targetId ?? input.treaty.manifest.handoffId;
  if (!input.submittedAt || !input.treaty?.manifest?.treatyId || !targetId) {
    throw new Error("VALIDATION_SCHEMA_INVALID");
  }

  return {
    validationId: hashExecutionTreatyValue("validation-request-id", {
      targetType: input.targetType,
      targetId,
      treatyId: input.treaty.manifest.treatyId,
      submittedAt: input.submittedAt,
    }),
    targetType: input.targetType,
    targetId,
    submittedAt: input.submittedAt,
    payloadHash: input.treaty.hashes.treatyHash,
    treatyId: input.treaty.manifest.treatyId,
    replaySnapshotId: input.treaty.manifest.replaySnapshotHash,
    governanceSnapshotId: input.treaty.manifest.governanceSnapshotHash,
    runtimeProfileId: input.runtimeProfileId ?? input.treaty.manifest.executionCompatibilityHash,
  };
}
