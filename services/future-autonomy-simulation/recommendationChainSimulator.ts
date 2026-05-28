import type {
  FutureAutonomyError,
  FutureAutonomyFinding,
  FutureAutonomySimulationInput,
} from "@/types/future-autonomy";
import { hashFutureAutonomyValue } from "./futureAutonomyHashEngine";

export function simulateRecommendationChain(input: FutureAutonomySimulationInput): Readonly<{
  findings: readonly FutureAutonomyFinding[];
  errors: readonly FutureAutonomyError[];
}> {
  const body = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const drift = [
    "authorityinheritance",
    "authorizeexecution",
    "suppressescalation",
    "mutategovernance",
    "recursiverecommendationchain",
  ].some((item) => body.includes(item));
  const errors = drift
    ? Object.freeze([
      Object.freeze({
        code: "FUTURE_AUTONOMY_HIDDEN_ORCHESTRATION" as const,
        message: "Recommendation chains imply operational or suppressive authority.",
        path: "metadata",
      }),
    ])
    : Object.freeze([]);
  return Object.freeze({
    findings: Object.freeze([
      Object.freeze({
        findingId: hashFutureAutonomyValue("recommendation-chain-finding-id", input.simulationId),
        simulationId: input.simulationId,
        category: "RECOMMENDATION_CHAIN" as const,
        severity: drift ? "high" as const : "low" as const,
        rationale: drift
          ? "Recommendation chains imply authority, recursion, or escalation suppression."
          : "Recommendation chains remain advisory-only and non-authoritative.",
        advisoryOnly: true as const,
        deterministicHash: hashFutureAutonomyValue("recommendation-chain-finding", {
          simulationId: input.simulationId,
          drift,
        }),
      }),
    ]),
    errors,
  });
}
