import type { HiddenExecutionDetectionInput, HiddenExecutionFinding } from "./types/hiddenExecutionDetectionTypes";
import { hashHiddenExecutionValue } from "./hiddenExecutionHashEngine";
import { scanExecutionSemantics } from "./executionSemanticsScanner";

const DISPATCH_TERMS = Object.freeze([
  "dispatch when",
  "send to worker",
  "trigger handler",
  "publish event",
  "route to execution",
  "invoke capability",
  "dispatch when confidence > 0.9",
]);

export function detectImplicitDispatchSemantics(input: HiddenExecutionDetectionInput): readonly HiddenExecutionFinding[] {
  return Object.freeze(
    scanExecutionSemantics(input)
      .flatMap((entry) => DISPATCH_TERMS
        .filter((term) => entry.value.toLowerCase().includes(term))
        .map((term) => {
          const vector = term.includes("publish event")
            ? "event_triggered_execution" as const
            : "implicit_dispatch_semantics" as const;
          return Object.freeze({
            findingId: hashHiddenExecutionValue("implicit-dispatch-finding-id", { path: entry.path, term }),
            vector,
            severity: "critical" as const,
            path: entry.path,
            matchedTerm: term,
            evidence: entry.value,
            blocked: true,
            escalationRequired: true,
            executionAuthorized: false as const,
            findingHash: hashHiddenExecutionValue("implicit-dispatch-finding", { path: entry.path, term, evidence: entry.value }),
          });
        })),
  );
}
