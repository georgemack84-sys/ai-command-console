import type {
  EscalationRequirement,
  FutureAutonomyFinding,
  FutureAutonomySimulationInput,
} from "@/types/future-autonomy";
import { hashFutureAutonomyValue } from "./futureAutonomyHashEngine";

function collect(input: FutureAutonomySimulationInput): readonly string[] {
  const output: string[] = [];
  const walk = (value: unknown): void => {
    if (typeof value === "string") {
      output.push(value.toLowerCase().replace(/[^a-z0-9]+/g, ""));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
        output.push(key.toLowerCase().replace(/[^a-z0-9]+/g, ""));
        walk(item);
      });
    }
  };
  walk(input.metadata);
  return output;
}

export function simulateEscalationPropagation(input: FutureAutonomySimulationInput): Readonly<{
  findings: readonly FutureAutonomyFinding[];
  escalationRequirements: readonly EscalationRequirement[];
  escalationHash: string;
}> {
  const normalized = collect(input);
  const uncertain = normalized.some((item) =>
    item.includes("confidencedegradation")
    || item.includes("governanceambiguity")
    || item.includes("replaymismatch")
    || item.includes("approvalinstability")
    || item.includes("recommendationdivergence")
    || item.includes("topologyambiguity")
    || item.includes("escalationsuppression"),
  ) || input.governanceDriftResult.record.failClosed;

  const findings = Object.freeze([
    Object.freeze({
      findingId: hashFutureAutonomyValue("escalation-propagation-finding-id", input.simulationId),
      simulationId: input.simulationId,
      category: "ESCALATION_PROPAGATION" as const,
      severity: uncertain ? "critical" as const : "low" as const,
      rationale: uncertain
        ? "Uncertainty increases restriction and governance review requirements."
        : "Escalation propagation remains visible and bounded.",
      advisoryOnly: true as const,
      deterministicHash: hashFutureAutonomyValue("escalation-propagation-finding", {
        simulationId: input.simulationId,
        uncertain,
      }),
    }),
  ]);

  const escalationRequirements = uncertain
    ? Object.freeze([
      Object.freeze({
        requirementId: hashFutureAutonomyValue("escalation-requirement-id", input.simulationId),
        simulationId: input.simulationId,
        reason: "Uncertainty requires elevated governance review.",
        escalationLevel: "critical" as const,
        deterministicHash: hashFutureAutonomyValue("escalation-requirement", {
          simulationId: input.simulationId,
          uncertain,
        }),
      }),
    ])
    : Object.freeze([]);

  return Object.freeze({
    findings,
    escalationRequirements,
    escalationHash: hashFutureAutonomyValue("escalation-hash", escalationRequirements),
  });
}
