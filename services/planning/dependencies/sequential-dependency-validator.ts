import type { NormalizedPlan } from "../normalization";
import { buildDependencyGraph } from "./dependency-graph-builder";
import { createDependencyError } from "./dependency-errors";
import { createDependencyGraphFingerprint } from "./dependency-graph-fingerprint";
import { createDependencyValidationReport } from "./dependency-validation-report";
import { validateBranchSemantics } from "./branch-semantics-validator";
import { detectDependencyCycles } from "./cycle-detector";
import { validateDependencyPolicies } from "./dependency-policy-validator";
import { validateGateInheritance } from "./gate-inheritance-validator";
import { validateDependencyReferences } from "./reference-validator";
import { stableTopologicalSort } from "./stable-topological-sorter";
import type { SequentialDependencyValidationResult } from "./dependency-types";

function isNormalizedPlan(input: unknown): input is NormalizedPlan {
  return Boolean(
    input
    && typeof input === "object"
    && typeof (input as { normalizationVersion?: unknown }).normalizationVersion === "string"
    && typeof (input as { validatedGraphHash?: unknown }).validatedGraphHash === "string"
    && typeof (input as { validationHash?: unknown }).validationHash === "string"
    && typeof (input as { replayHash?: unknown }).replayHash === "string"
    && typeof (input as { evidenceRef?: unknown }).evidenceRef === "string"
    && Array.isArray((input as { steps?: unknown }).steps),
  );
}

export function validateSequentialDependencies(input: unknown): SequentialDependencyValidationResult {
  if (!isNormalizedPlan(input)) {
    return createDependencyValidationReport({
      ok: false,
      planId: "unknown-plan",
      errors: [createDependencyError(
        "PLAN_DEPENDENCY_POLICY_VIOLATION",
        "Phase 4.2D only accepts 4.2C-normalized plan artifacts.",
      )],
      warnings: [],
    });
  }

  const normalizedPlan = input;
  const graph = buildDependencyGraph(normalizedPlan);
  const reference = validateDependencyReferences(normalizedPlan);
  const cycle = detectDependencyCycles(graph);
  const ordering = stableTopologicalSort(graph);
  const gateInheritance = validateGateInheritance(normalizedPlan, graph);
  const branchSemantics = validateBranchSemantics(normalizedPlan, graph);
  const policy = validateDependencyPolicies(normalizedPlan, graph);

  const errors = [
    ...reference.errors,
    ...cycle.errors,
    ...ordering.errors,
    ...gateInheritance.errors,
    ...branchSemantics.errors,
    ...policy.errors,
  ];

  const dependencyGraphFingerprint = errors.length === 0
    ? createDependencyGraphFingerprint(graph)
    : undefined;

  return createDependencyValidationReport({
    ok: errors.length === 0,
    planId: normalizedPlan.planId,
    graph,
    orderedStepIds: ordering.orderedStepIds,
    dependencyGraphFingerprint,
    errors,
    warnings: [],
  });
}
