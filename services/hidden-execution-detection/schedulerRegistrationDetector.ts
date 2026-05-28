import type { HiddenExecutionDetectionInput, HiddenExecutionFinding } from "./types/hiddenExecutionDetectionTypes";
import { hashHiddenExecutionValue } from "./hiddenExecutionHashEngine";
import { scanExecutionSemantics } from "./executionSemanticsScanner";

const SCHEDULER_TERMS = Object.freeze([
  "cron",
  "timer",
  "interval",
  "delayed job",
  "background task",
  "scheduled retry",
  "polling registration",
  "schedule this later",
  "register worker",
]);

export function detectSchedulerRegistration(input: HiddenExecutionDetectionInput): readonly HiddenExecutionFinding[] {
  return Object.freeze(
    scanExecutionSemantics(input)
      .flatMap((entry) => SCHEDULER_TERMS
        .filter((term) => entry.value.toLowerCase().includes(term))
        .map((term) => Object.freeze({
          findingId: hashHiddenExecutionValue("scheduler-registration-finding-id", { path: entry.path, term }),
          vector: "scheduler_registration" as const,
          severity: "critical" as const,
          path: entry.path,
          matchedTerm: term,
          evidence: entry.value,
          blocked: true,
          escalationRequired: true,
          executionAuthorized: false as const,
          findingHash: hashHiddenExecutionValue("scheduler-registration-finding", { path: entry.path, term, evidence: entry.value }),
        }))),
  );
}
