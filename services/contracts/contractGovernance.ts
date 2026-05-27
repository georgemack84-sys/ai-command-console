import type { ContractDefinitionInput } from "./contractTypes";

export function evaluateContractGovernance(input: {
  approved: boolean;
  owner: string;
  replayVerified: boolean;
  compatibilityVerified: boolean;
}) {
  if (!String(input.owner || "").trim()) {
    return { ok: false as const, code: "API_CONTRACT_MISSING" };
  }
  if (!input.approved || !input.replayVerified || !input.compatibilityVerified) {
    return { ok: false as const, code: "API_SCHEMA_INVALID" };
  }
  return { ok: true as const };
}

export function assertContractGovernance(definition: ContractDefinitionInput) {
  const result = evaluateContractGovernance({
    approved: definition.governance.approved,
    owner: definition.owner,
    replayVerified: definition.governance.replayVerified !== false,
    compatibilityVerified: definition.governance.compatibilityVerified !== false,
  });

  if (!result.ok) {
    throw new Error(result.code);
  }
}
