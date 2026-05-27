import type { HiddenExecutionDetectionInput, HiddenExecutionFinding } from "./types/hiddenExecutionDetectionTypes";
import { hashHiddenExecutionValue } from "./hiddenExecutionHashEngine";
import { scanExecutionSemantics } from "./executionSemanticsScanner";

const RETRY_TERMS = Object.freeze([
  "retry until success",
  "retry until successful",
  "exponential backoff",
  "recovery loop",
  "resubmit automatically",
  "retry queue",
  "self-heal attempt",
  "auto-heal failed proposal",
]);

export function detectRetryLoops(input: HiddenExecutionDetectionInput): readonly HiddenExecutionFinding[] {
  return Object.freeze(
    scanExecutionSemantics(input)
      .flatMap((entry) => RETRY_TERMS
        .filter((term) => entry.value.toLowerCase().includes(term))
        .map((term) => {
          const vector = term.includes("heal") ? "self_repair_semantics" : "retry_loop";
          return Object.freeze({
            findingId: hashHiddenExecutionValue("retry-loop-finding-id", { path: entry.path, term }),
            vector,
            severity: "critical" as const,
            path: entry.path,
            matchedTerm: term,
            evidence: entry.value,
            blocked: true,
            escalationRequired: true,
            executionAuthorized: false as const,
            findingHash: hashHiddenExecutionValue("retry-loop-finding", { path: entry.path, term, evidence: entry.value }),
          });
        })),
  );
}
