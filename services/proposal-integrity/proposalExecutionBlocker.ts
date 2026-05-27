import type { ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

const EXECUTION_TERMS = [
  "execute",
  "run",
  "activate",
  "invoke",
  "dispatch",
  "perform",
  "auto-run",
  "launch",
  "start workflow",
  "queue",
  "schedule",
  "cron",
  "retry",
  "trusted workflow",
] as const;

export function blockProposalExecution(
  input: ProposalIntegrityInput,
): readonly ProposalIntegrityError[] {
  const summary = `${input.title} ${input.summary}`.toLowerCase();
  const errors: ProposalIntegrityError[] = [];
  if (EXECUTION_TERMS.some((term) => summary.includes(term))) {
    errors.push({
      code: "PROPOSAL_EXECUTION_SEMANTICS_DETECTED",
      message: "Execution semantics were detected in proposal text.",
      path: "summary",
    });
  }
  if (summary.includes("orchestrat")) {
    errors.push({
      code: "PROPOSAL_ORCHESTRATION_LINKAGE_DETECTED",
      message: "Orchestration semantics were detected in proposal text.",
      path: "summary",
    });
  }
  if (
    summary.includes("scheduler")
    || summary.includes("schedule")
    || summary.includes("cron")
    || summary.includes("timeout")
    || summary.includes("background worker")
  ) {
    errors.push({
      code: "PROPOSAL_SCHEDULER_LINKAGE_DETECTED",
      message: "Scheduler semantics were detected in proposal text.",
      path: "summary",
    });
  }
  if (input.metadata?.runtimeLinked === true) {
    errors.push({
      code: "PROPOSAL_RUNTIME_LINKAGE_DETECTED",
      message: "Runtime-linked proposal semantics were detected.",
      path: "metadata",
    });
  }
  return Object.freeze(errors);
}
