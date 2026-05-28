import type { HiddenExecutionDetectionInput, HiddenExecutionFinding } from "./types/hiddenExecutionDetectionTypes";
import { hashHiddenExecutionValue } from "./hiddenExecutionHashEngine";
import { scanExecutionSemantics } from "./executionSemanticsScanner";

const QUEUE_TERMS = Object.freeze([
  "queuename",
  "workerqueue",
  "taskqueue",
  "message broker",
  "pubsub",
  "event bus",
  "job queue",
  "enqueue recommendation",
  "publish event to execution bus",
]);

export function detectUnauthorizedQueues(input: HiddenExecutionDetectionInput): readonly HiddenExecutionFinding[] {
  return Object.freeze(
    scanExecutionSemantics(input)
      .flatMap((entry) => QUEUE_TERMS
        .filter((term) => entry.value.toLowerCase().includes(term))
        .map((term) => {
          const vector =
            term.includes("event bus") || term.includes("publish event")
              ? "background_worker_semantics"
              : "unauthorized_queue";
          return Object.freeze({
            findingId: hashHiddenExecutionValue("unauthorized-queue-finding-id", { path: entry.path, term }),
            vector,
            severity: "critical" as const,
            path: entry.path,
            matchedTerm: term,
            evidence: entry.value,
            blocked: true,
            escalationRequired: true,
            executionAuthorized: false as const,
            findingHash: hashHiddenExecutionValue("unauthorized-queue-finding", { path: entry.path, term, evidence: entry.value }),
          });
        })),
  );
}
