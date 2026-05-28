import type { RecoveryVerificationState } from "./recoveryVerificationTypes";

export function decideRecoveryVerificationState({
  replayIntegrity,
  governanceIntegrity,
  runtimeIntegrity,
  continuityIntegrity,
  disputeCount,
}: {
  replayIntegrity: boolean;
  governanceIntegrity: boolean;
  runtimeIntegrity: boolean;
  continuityIntegrity: boolean;
  disputeCount: number;
}): RecoveryVerificationState {
  if (disputeCount > 0 && !replayIntegrity) {
    return "DISPUTED";
  }
  if (!replayIntegrity || !governanceIntegrity) {
    return "FAILED";
  }
  if (!runtimeIntegrity || !continuityIntegrity) {
    return "PARTIAL";
  }
  if (disputeCount > 0) {
    return "DISPUTED";
  }
  return "VERIFIED";
}
