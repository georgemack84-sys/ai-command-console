import type { HiddenExecutionSeverity, HiddenExecutionVector } from "./types/hiddenExecutionDetectionTypes";

export const HIDDEN_EXECUTION_POLICY = Object.freeze({
  executionAuthorized: false,
  failClosedOnUncertainty: true,
  criticalVectors: Object.freeze<readonly HiddenExecutionVector[]>([
    "delayed_invocation_path",
    "scheduler_registration",
    "recursive_orchestration",
    "retry_loop",
    "hidden_adapter",
    "unauthorized_queue",
    "implicit_dispatch_semantics",
    "runtime_mutation_pathway",
    "event_triggered_execution",
    "background_worker_semantics",
    "callback_invocation_path",
    "self_repair_semantics",
    "authority_expansion_path",
  ]),
  ambiguousSeverity: "low" as HiddenExecutionSeverity,
  suspiciousMetadataSeverity: "medium" as HiddenExecutionSeverity,
  executableReferenceSeverity: "high" as HiddenExecutionSeverity,
  criticalSeverity: "critical" as HiddenExecutionSeverity,
});
