import type {
  FutureAutonomyFinding,
  FutureAutonomySimulationInput,
} from "@/types/future-autonomy";
import { hashFutureAutonomyValue } from "./futureAutonomyHashEngine";

function markers(input: FutureAutonomySimulationInput): readonly string[] {
  const values: string[] = [];
  const walk = (value: unknown): void => {
    if (typeof value === "string") {
      values.push(value.toLowerCase().replace(/[^a-z0-9]+/g, ""));
      return;
    }
    if (typeof value === "boolean" || typeof value === "number") {
      values.push(String(value).toLowerCase());
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
        values.push(key.toLowerCase().replace(/[^a-z0-9]+/g, ""));
        walk(item);
      });
    }
  };
  walk(input.metadata);
  return values;
}

export function simulateBoundedCoordination(
  input: FutureAutonomySimulationInput,
): readonly FutureAutonomyFinding[] {
  const normalized = markers(input);
  const risky = normalized.some((item) =>
    item.includes("dispatch")
    || item.includes("orchestration")
    || item.includes("runtimecoordination")
    || item.includes("recursivecoordinationgrowth"),
  );
  return Object.freeze([
    Object.freeze({
      findingId: hashFutureAutonomyValue("bounded-coordination-finding-id", input.simulationId),
      simulationId: input.simulationId,
      category: "BOUNDED_COORDINATION" as const,
      severity: risky ? "high" as const : "low" as const,
      rationale: risky
        ? "Coordination markers imply growth beyond bounded simulation."
        : "Coordination remains grouped, visible, and bounded.",
      advisoryOnly: true as const,
      deterministicHash: hashFutureAutonomyValue("bounded-coordination-finding", {
        simulationId: input.simulationId,
        risky,
      }),
    }),
  ]);
}
