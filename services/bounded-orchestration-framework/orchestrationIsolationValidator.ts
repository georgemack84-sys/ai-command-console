import type { BoundedOrchestrationInput, OrchestrationIsolationAssessment } from "@/types/bounded-orchestration-framework";
import { buildOrchestrationIsolationScope } from "./orchestrationIsolationLayer";

const LEAK_MARKERS = [
  "crossscope",
  "sharedruntime",
  "missionleak",
  "approvalleak",
  "governanceleak",
  "replayscopeleak",
];

export function assessOrchestrationIsolation(input: BoundedOrchestrationInput): OrchestrationIsolationAssessment {
  const scope = buildOrchestrationIsolationScope(input);
  const leakedScopes = new Set<string>();
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  for (const marker of LEAK_MARKERS) {
    if (serialized.includes(marker)) {
      leakedScopes.add(marker);
    }
  }
  if (!scope.governanceSnapshotId) {
    leakedScopes.add("governanceSnapshotId");
  }
  if (!scope.replaySnapshotId) {
    leakedScopes.add("replaySnapshotId");
  }
  if (!scope.coordinationId) {
    leakedScopes.add("coordinationId");
  }
  return Object.freeze({
    isolated: leakedScopes.size === 0,
    leakedScopes: Object.freeze([...leakedScopes].sort()),
    scope,
  });
}

export function validateOrchestrationIsolation(input: Readonly<{
  missionScopeId: string;
  governanceScopeId: string;
  replayScopeId: string;
  approvalScopeId: string;
  escalationScopeId?: string;
  containmentScopeId: string;
  coordinationScopeId: string;
  isolated: boolean;
  isolationHash: string;
}>): readonly string[];
export function validateOrchestrationIsolation(input: BoundedOrchestrationInput): OrchestrationIsolationAssessment;
export function validateOrchestrationIsolation(input:
  | BoundedOrchestrationInput
  | Readonly<{
    missionScopeId: string;
    governanceScopeId: string;
    replayScopeId: string;
    approvalScopeId: string;
    escalationScopeId?: string;
    containmentScopeId: string;
    coordinationScopeId: string;
    isolated: boolean;
    isolationHash: string;
  }>,
): readonly string[] | OrchestrationIsolationAssessment {
  if ("coordinationRecord" in input) {
    return assessOrchestrationIsolation(input);
  }

  const errors: string[] = [];
  if (!input.governanceScopeId) {
    errors.push("governanceScopeId");
  }
  if (!input.replayScopeId) {
    errors.push("replayScopeId");
  }
  if (!input.approvalScopeId) {
    errors.push("approvalScopeId");
  }
  if (!input.containmentScopeId) {
    errors.push("containmentScopeId");
  }
  if (!input.coordinationScopeId) {
    errors.push("coordinationScopeId");
  }
  return Object.freeze(errors.sort());
}
