import type { SafeActionDefinition } from "@/types/safe-action-catalog";
import { hashSafeActionValue } from "./safeActionHasher";

const BASE_ACTIONS = [
  "observe",
  "recommend",
  "simulate",
  "escalate",
  "pause_request",
  "prepare_handoff",
] as const;

const registry = Object.freeze(
  BASE_ACTIONS.map((category) =>
    Object.freeze({
      id: `safe-action:${category}`,
      version: "4.5B",
      category,
      allowedAutonomyLevels: Object.freeze(["A0", "A1", "A2"] as const),
      futureBoundLevels: Object.freeze(["A3", "A4", "A5"] as const),
      forbiddenLevels: Object.freeze(["A6"] as const),
      mutating: false,
      executionAllowed: false,
      selfApprovalAllowed: false,
      policyMutationAllowed: false,
      requiresGovernanceBinding: true,
      requiresReplayBinding: true,
      requiresAudit: true,
    } satisfies SafeActionDefinition),
  ),
);

export function listSafeActionDefinitions(): readonly SafeActionDefinition[] {
  return registry;
}

export function getSafeActionDefinition(actionId: string): SafeActionDefinition | undefined {
  return registry.find((definition) => definition.id === actionId);
}

export function getSafeActionRegistryHash(): string {
  return hashSafeActionValue("safe-action-registry", registry);
}
