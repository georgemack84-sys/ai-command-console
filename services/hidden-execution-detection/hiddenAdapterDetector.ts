import type { HiddenExecutionDetectionInput, HiddenExecutionFinding } from "./types/hiddenExecutionDetectionTypes";
import { hashHiddenExecutionValue } from "./hiddenExecutionHashEngine";
import { scanExecutionSemantics } from "./executionSemanticsScanner";

const ADAPTER_TERMS = Object.freeze([
  "adapterid",
  "toolid",
  "handlerid",
  "runtimetarget",
  "connectorid",
  "executiontarget",
  "dispatchtarget",
  "bind adapter after approval",
  "invoke tool after operator review",
]);

export function detectHiddenAdapters(input: HiddenExecutionDetectionInput): readonly HiddenExecutionFinding[] {
  return Object.freeze(
    scanExecutionSemantics(input)
      .flatMap((entry) => ADAPTER_TERMS
        .filter((term) => entry.value.toLowerCase().includes(term))
        .map((term) => Object.freeze({
          findingId: hashHiddenExecutionValue("hidden-adapter-finding-id", { path: entry.path, term }),
          vector: term.includes("tool") ? "callback_invocation_path" as const : "hidden_adapter" as const,
          severity: "high" as const,
          path: entry.path,
          matchedTerm: term,
          evidence: entry.value,
          blocked: true,
          escalationRequired: true,
          executionAuthorized: false as const,
          findingHash: hashHiddenExecutionValue("hidden-adapter-finding", { path: entry.path, term, evidence: entry.value }),
        }))),
  );
}
