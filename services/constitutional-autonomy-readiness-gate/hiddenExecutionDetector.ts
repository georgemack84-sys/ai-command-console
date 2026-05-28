import type { ConstitutionalReadinessError } from "@/types/constitutional-autonomy-readiness-gate";
import { createReadinessError } from "./readinessErrors";

const FORBIDDEN_METADATA_PATTERN = /schedulerid|queueid|workerid|processid|lockowner|runtimehandle|dispatchid|executionhandle|orchestrationid|retryloop|backgroundtask|autonomousrecovery|selfhealing|adaptiveauthority|dynamicauthority|selfapproval|shell|spawn|exec|recursivedelegation/i;

export function detectHiddenExecution(input: {
  metadata?: Readonly<Record<string, unknown>>;
  extraEvidence?: readonly string[];
}): Readonly<{
  hiddenExecutionDetected: boolean;
  findings: readonly string[];
  errors: readonly ConstitutionalReadinessError[];
}> {
  const findings = Object.freeze([
    ...(input.metadata
      ? Object.keys(input.metadata).filter((key) => FORBIDDEN_METADATA_PATTERN.test(key)).map((key) => `Forbidden metadata key detected: ${key}`)
      : []),
    ...(input.extraEvidence ?? []).filter((entry) => FORBIDDEN_METADATA_PATTERN.test(entry)),
  ]);
  const hiddenExecutionDetected = findings.length > 0;

  return Object.freeze({
    hiddenExecutionDetected,
    findings,
    errors: Object.freeze(
      hiddenExecutionDetected ? [createReadinessError("AUTONOMY_EXECUTION_LIMIT", "Hidden execution or orchestration semantics were detected.", "metadata")] : [],
    ),
  });
}
