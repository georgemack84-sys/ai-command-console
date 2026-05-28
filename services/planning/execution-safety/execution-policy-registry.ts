import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";

import type { PolicyLockSnapshot } from "./execution-safety-types";

type StaticPolicy = {
  policyId: string;
  policyVersion: string;
  enforcementMode: "advisory" | "enforced";
};

export function createStaticExecutionPolicyRegistry(): StaticPolicy[] {
  return [
    { policyId: "execution-governance", policyVersion: "4.2F", enforcementMode: "enforced" },
    { policyId: "rollback-safety", policyVersion: "4.2F", enforcementMode: "enforced" },
    { policyId: "autonomy-boundary", policyVersion: "4.2F", enforcementMode: "enforced" },
  ];
}

export function resolvePolicyLocks(policyIds?: string[]): PolicyLockSnapshot[] {
  const registry = createStaticExecutionPolicyRegistry();
  const selected = policyIds && policyIds.length > 0
    ? registry.filter((policy) => policyIds.includes(policy.policyId))
    : registry;

  return selected.map((policy) => ({
    policyId: policy.policyId,
    policyVersion: policy.policyVersion,
    policyHash: hashPayloadDeterministically(policy),
    enforcementMode: policy.enforcementMode,
  }));
}
