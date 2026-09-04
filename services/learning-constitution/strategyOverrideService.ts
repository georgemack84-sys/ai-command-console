import type { StrategyDefinition } from "../../types/learning-constitution/strategyRegistry";
import type { StrategyOverride, StrategySelectionRecord } from "../../types/learning-constitution/strategySelectionEngine";
/** Validates a human strategy choice as an auditable counterfactual; approval and execution remain separate. */
export class StrategyOverrideService {
  create(input: Readonly<{ overrideId: string; selection: StrategySelectionRecord; alternate: StrategyDefinition; reason: string; expectedOutcome: string; actor: StrategyOverride["actor"]; createdAt: string }>): StrategyOverride {
    if (input.actor.actorType !== "HUMAN") throw new Error("Only a human may override a strategy recommendation.");
    if (input.selection.status !== "RECOMMENDED" || !input.selection.selectedStrategyId) throw new Error("Only a recommended selection may be overridden.");
    if (input.alternate.lifecycle !== "ACTIVE") throw new Error("A human override requires an active alternate strategy.");
    if (input.alternate.strategyId === input.selection.selectedStrategyId) throw new Error("Override strategy must differ from the recommendation.");
    if (!input.reason.trim() || !input.expectedOutcome.trim()) throw new Error("Override reason and expected outcome are required.");
    return { overrideId: input.overrideId, selectionId: input.selection.selectionId, selectedStrategyId: input.alternate.strategyId, overriddenStrategyId: input.selection.selectedStrategyId, reason: input.reason, expectedOutcome: input.expectedOutcome, actor: input.actor, createdAt: input.createdAt, immutable: true, requiresApprovedPlan: true, executionPermissionGranted: false, authorityEffect: "UNCHANGED" };
  }
}
