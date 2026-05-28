import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";

import { serializeDeterministically } from "../normalization";
import type { AutonomyEnvelope, DeterministicRiskProfile, GovernanceEnvelope, ReplayEnvelope } from "./execution-truth-types";

export function hashExecutionTruth(input: {
  dependencyGraphFingerprint: string;
  riskProfile: DeterministicRiskProfile;
  governanceEnvelope: GovernanceEnvelope;
  autonomyEnvelope: AutonomyEnvelope;
  replayEnvelope: ReplayEnvelope;
  version?: string;
}): string {
  return hashPayloadDeterministically(JSON.parse(serializeDeterministically({
    version: input.version ?? "4.2E",
    dependencyGraphFingerprint: input.dependencyGraphFingerprint,
    riskProfile: input.riskProfile,
    governanceEnvelope: input.governanceEnvelope,
    autonomyEnvelope: input.autonomyEnvelope,
    replayEnvelope: {
      sourceFingerprint: input.replayEnvelope.sourceFingerprint,
      replayHash: input.replayEnvelope.replayHash,
      replayable: input.replayEnvelope.replayable,
    },
  })));
}
