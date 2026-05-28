import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";
import { serializeDeterministically } from "../normalization";
import type { ExecutionSafetyHashInput } from "./execution-safety-types";

export function hashExecutionSafetyContract(input: ExecutionSafetyHashInput): string {
  return hashPayloadDeterministically(JSON.parse(serializeDeterministically({
    planId: input.contract.planId,
    executionTruthHash: input.contract.executionTruthHash,
    dependencyGraphFingerprint: input.contract.dependencyGraphFingerprint,
    executionSafetyState: input.contract.executionSafetyState,
    governance: input.contract.governance,
    rollback: input.contract.rollback,
    approvals: input.contract.approvals,
    autonomy: input.contract.autonomy,
    freezeReasons: input.contract.freezeReasons,
    escalationLevel: input.contract.escalationLevel,
    containmentZone: input.contract.containmentZone,
    policyLocks: input.contract.policyLocks,
    replaySourceHash: input.contract.replaySourceHash,
  })));
}
