import type { HiddenExecutionDetectionInput, HiddenExecutionFinding } from "./types/hiddenExecutionDetectionTypes";
import { hashHiddenExecutionValue } from "./hiddenExecutionHashEngine";
import { scanExecutionSemantics } from "./executionSemanticsScanner";

const DELAYED_INVOCATION_TERMS = Object.freeze([
  "run later",
  "invoke after approval",
  "execute when confidence improves",
  "dispatch after review",
  "trigger on threshold",
  "deferred runtime call",
  "run after replay certification",
]);

export function detectDelayedInvocationPaths(input: HiddenExecutionDetectionInput): readonly HiddenExecutionFinding[] {
  return Object.freeze(
    scanExecutionSemantics(input)
      .flatMap((entry) => DELAYED_INVOCATION_TERMS
        .filter((term) => entry.value.toLowerCase().includes(term))
        .map((term) => Object.freeze({
          findingId: hashHiddenExecutionValue("delayed-invocation-finding-id", { path: entry.path, term }),
          vector: "delayed_invocation_path" as const,
          severity: "critical" as const,
          path: entry.path,
          matchedTerm: term,
          evidence: entry.value,
          blocked: true,
          escalationRequired: true,
          executionAuthorized: false as const,
          findingHash: hashHiddenExecutionValue("delayed-invocation-finding", { path: entry.path, term, evidence: entry.value }),
        }))),
  );
}
