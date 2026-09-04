import type { StrategyDefinition, StrategyLifecycleEvent, StrategyLifecycleStatus, StrategyRegistryStore } from "../../types/learning-constitution/strategyRegistry";

const transitions: Readonly<Record<StrategyLifecycleStatus, readonly StrategyLifecycleStatus[]>> = { HYPOTHESIS: ["CANDIDATE", "REJECTED"], CANDIDATE: ["EXPERIMENTAL", "REJECTED"], EXPERIMENTAL: ["VALIDATED", "REJECTED", "SUSPENDED"], VALIDATED: ["APPROVED", "REJECTED", "SUSPENDED"], APPROVED: ["ACTIVE", "SUSPENDED", "RETIRED"], ACTIVE: ["SUSPENDED", "SUPERSEDED", "RETIRED"], REJECTED: [], SUPERSEDED: [], SUSPENDED: ["ACTIVE", "RETIRED"], RETIRED: [] };
const validDate = (value: string) => !Number.isNaN(Date.parse(value));
/** Durable strategy catalog. Registry records define learning architecture, never permission to execute or alter constitutional state. */
export class StrategyRegistryService {
  constructor(private readonly artifacts: StrategyRegistryStore) {}
  async register(definition: StrategyDefinition): Promise<StrategyDefinition> {
    if (!definition.strategyId.trim() || !definition.name.trim() || definition.version < 1 || !validDate(definition.createdAt) || !definition.purpose.length || !definition.applicableContexts.length || !definition.steps.length || definition.lifecycle !== "HYPOTHESIS" || definition.learningEffect !== "NONE" || definition.authorityEffect !== "UNCHANGED" || definition.executionPermissionGranted) throw new Error("strategy definitions begin as governed hypotheses with a non-authoritative learning effect");
    const ordinals = definition.steps.map((step) => step.ordinal); if (new Set(ordinals).size !== ordinals.length || ordinals.some((ordinal) => !Number.isInteger(ordinal) || ordinal < 1) || definition.parameters.some((parameter) => !parameter.name.trim() || (parameter.minimum !== undefined && typeof parameter.value === "number" && parameter.value < parameter.minimum) || (parameter.maximum !== undefined && typeof parameter.value === "number" && parameter.value > parameter.maximum))) throw new Error("strategy steps and parameters must be well-formed");
    await this.artifacts.append({ artifactId: `STRATEGY:${definition.strategyId}:v${definition.version}`, artifactType: "STRATEGY", subjectId: definition.strategyId, payload: definition, createdAt: definition.createdAt });
    return definition;
  }
  async transition(input: Readonly<{ eventId: string; strategy: StrategyDefinition; to: StrategyLifecycleStatus; reason: string; actor: StrategyLifecycleEvent["actor"]; occurredAt: string }>): Promise<StrategyLifecycleEvent> {
    if (!input.eventId.trim() || !input.reason.trim() || !validDate(input.occurredAt) || !transitions[input.strategy.lifecycle].includes(input.to)) throw new Error("invalid strategy lifecycle transition");
    if ((input.to === "APPROVED" || input.to === "ACTIVE") && input.actor.actorType !== "HUMAN") throw new Error("only a human governor may approve or activate a strategy");
    const event: StrategyLifecycleEvent = { eventId: input.eventId, strategyId: input.strategy.strategyId, version: input.strategy.version, from: input.strategy.lifecycle, to: input.to, reason: input.reason, actor: input.actor, occurredAt: input.occurredAt, immutable: true, executionPermissionGranted: false, authorityEffect: "UNCHANGED" };
    await this.artifacts.append({ artifactId: `STRATEGY_LIFECYCLE:${event.eventId}`, artifactType: "LIFECYCLE", subjectId: event.strategyId, payload: event, createdAt: event.occurredAt });
    return event;
  }
}
