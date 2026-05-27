import type { ContractDefinitionInput } from "./contractTypes";

export function assertContractOwnership(definition: ContractDefinitionInput) {
  if (!String(definition.owner || "").trim()) {
    throw new Error("API_CONTRACT_MISSING");
  }
}
