import type {
  FutureAutonomyError,
  FutureAutonomyFinding,
  FutureAutonomySimulationInput,
} from "@/types/future-autonomy";
import { hashFutureAutonomyValue } from "./futureAutonomyHashEngine";

export function simulateApprovalRouting(input: FutureAutonomySimulationInput): Readonly<{
  findings: readonly FutureAutonomyFinding[];
  errors: readonly FutureAutonomyError[];
}> {
  const normalized = JSON.stringify(input.metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const invalid = [
    "approvalcommit",
    "approvalmutation",
    "liverouting",
    "approvalinheritance",
    "approvalreplaycurrentstate",
  ].some((item) => normalized.includes(item));
  return Object.freeze({
    findings: Object.freeze([
      Object.freeze({
        findingId: hashFutureAutonomyValue("approval-routing-finding-id", input.simulationId),
        simulationId: input.simulationId,
        category: "APPROVAL_ROUTING" as const,
        severity: invalid ? "critical" as const : "low" as const,
        rationale: invalid
          ? "Approval routing simulation implies live mutation or inherited approval authority."
          : "Approval routing remains hypothetical and detached from live approvals.",
        advisoryOnly: true as const,
        deterministicHash: hashFutureAutonomyValue("approval-routing-finding", {
          simulationId: input.simulationId,
          invalid,
        }),
      }),
    ]),
    errors: invalid
      ? Object.freeze([
        Object.freeze({
          code: "FUTURE_AUTONOMY_APPROVAL_INHERITANCE" as const,
          message: "Approval routing cannot mutate or inherit live approval authority.",
          path: "metadata",
        }),
      ])
      : Object.freeze([]),
  });
}
