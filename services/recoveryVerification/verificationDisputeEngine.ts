import { detectTruthDisputes } from "./truthDisputeDetector";

export function evaluateVerificationDisputes(input: Parameters<typeof detectTruthDisputes>[0]) {
  const disputes = detectTruthDisputes(input);
  return {
    disputes,
    blocking: disputes.some((dispute) => dispute.severity === "CRITICAL" || dispute.severity === "HIGH"),
  };
}
