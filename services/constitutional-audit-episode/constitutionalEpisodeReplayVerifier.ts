import type {
  ConstitutionalAuditEpisodeInput,
  ReplayVerificationResult,
} from "@/types/constitutional-audit-episode";
import { hashConstitutionalAuditValue } from "./constitutionalEpisodeHashEngine";

export function verifyConstitutionalEpisodeReplay(
  input: ConstitutionalAuditEpisodeInput,
  disputeDetected: boolean,
): ReplayVerificationResult {
  const replayVerified = input.futureAutonomyResult.result.replaySafe && !disputeDetected;
  const replayDeterministic = replayVerified && input.futureAutonomyResult.record.replaySafe;
  return Object.freeze({
    replayVerified,
    replayDeterministic,
    disputeDetected,
    verificationHash: hashConstitutionalAuditValue("constitutional-audit-replay-verification", {
      episodeId: input.episodeId,
      replayVerified,
      replayDeterministic,
      disputeDetected,
    }),
  });
}
