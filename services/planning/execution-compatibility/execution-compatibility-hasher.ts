import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";
import { serializeDeterministically } from "../normalization/deterministic-serializer";
import type { ExecutionCompatibilityContract } from "./execution-compatibility-types";

export function hashExecutionCompatibilityContract(contract: Omit<ExecutionCompatibilityContract, "executionCompatibilityHash" | "violations" | "compatible">): string {
  const payload = JSON.parse(serializeDeterministically({
    executionTruthHash: contract.executionTruthHash,
    approvalContracts: contract.approvalContracts.map((item) => ({
      ...item,
      expiresAt: undefined,
    })),
    rollbackContracts: contract.rollbackContracts,
    compensationContracts: contract.compensationContracts,
    authorityGraph: contract.authorityGraph,
    escalationGraph: contract.escalationGraph,
    compatibilitySnapshot: contract.compatibilitySnapshot,
  })) as unknown;

  return hashPayloadDeterministically(payload);
}
