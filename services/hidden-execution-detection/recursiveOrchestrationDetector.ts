import type { HiddenExecutionDetectionInput, HiddenExecutionFinding } from "./types/hiddenExecutionDetectionTypes";
import { hashHiddenExecutionValue } from "./hiddenExecutionHashEngine";
import { scanExecutionSemantics } from "./executionSemanticsScanner";

const RECURSIVE_ORCHESTRATION_TERMS = Object.freeze([
  "recommendation creates recommendation",
  "proposal creates proposal",
  "planner calls planner",
  "escalation triggers new escalation loop",
  "replay triggers new replay loop",
  "confidence rescore loop",
  "create follow-up proposal automatically",
]);

export function detectRecursiveOrchestration(input: HiddenExecutionDetectionInput): readonly HiddenExecutionFinding[] {
  return Object.freeze(
    scanExecutionSemantics(input)
      .flatMap((entry) => RECURSIVE_ORCHESTRATION_TERMS
        .filter((term) => entry.value.toLowerCase().includes(term))
        .map((term) => Object.freeze({
          findingId: hashHiddenExecutionValue("recursive-orchestration-finding-id", { path: entry.path, term }),
          vector: "recursive_orchestration" as const,
          severity: "critical" as const,
          path: entry.path,
          matchedTerm: term,
          evidence: entry.value,
          blocked: true,
          escalationRequired: true,
          executionAuthorized: false as const,
          findingHash: hashHiddenExecutionValue("recursive-orchestration-finding", { path: entry.path, term, evidence: entry.value }),
        }))),
  );
}
