export type ValidationTargetType =
  | "execution-treaty"
  | "handoff-package"
  | "validation-artifact"
  | "replay-artifact";

export type ValidationRequest = Readonly<{
  validationId: string;
  targetType: ValidationTargetType;
  targetId: string;
  submittedAt: string;
  payloadHash: string;
  treatyId?: string;
  replaySnapshotId?: string;
  governanceSnapshotId?: string;
  runtimeProfileId?: string;
}>;
