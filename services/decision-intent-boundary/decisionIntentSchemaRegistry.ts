export const EXECUTION_LANGUAGE = Object.freeze([
  "execute",
  "run",
  "activate",
  "invoke",
  "dispatch",
  "perform",
  "apply automatically",
  "auto-run",
  "self-execute",
  "launch",
  "start workflow",
]);

export const SCHEDULER_LANGUAGE = Object.freeze([
  "schedule",
  "cron",
  "job queue",
  "retry later",
  "background worker",
  "task runner",
  "delayed execution",
  "run after review timeout",
]);

export const ORCHESTRATION_LANGUAGE = Object.freeze([
  "route to executor",
  "activate orchestrator",
  "submit pipeline",
  "trigger execution chain",
  "begin workflow",
  "coordination activation",
  "begin orchestration",
]);

export const HIDDEN_AUTHORITY_LANGUAGE = Object.freeze([
  "implicitly approved",
  "safe to proceed",
  "auto-authorized",
  "requires no review",
  "trusted execution",
  "approved implicitly",
  "safe to auto-run",
]);

export const HIDDEN_DISPATCH_LANGUAGE = Object.freeze([
  "queue this task",
  "proposal ready for dispatch",
  "invoke automatically",
  "trusted workflow",
  "retry until success",
]);

export function normalizeIntentText(value: string): string {
  return value.trim().toLowerCase();
}

export function matchingIntentTerms(text: string, terms: readonly string[]): readonly string[] {
  const normalized = normalizeIntentText(text);
  return Object.freeze(terms.filter((term) => normalized.includes(term)));
}
