import { readFileSync } from "node:fs";
import path from "node:path";

import { buildProposalLifecycleRecord } from "@/services/proposal-lifecycle-engine";
import type {
  ProposalApproval,
  ProposalLifecycleInput,
  ProposalLineageLedger,
  ProposalRevocation,
  ProposalState,
  ProposalTransition,
} from "@/types/proposal-lifecycle-engine";
import { buildConstitutionalGovernanceFixture } from "@/tests/constitutional-governance/helpers";
import { buildReplayFixture } from "@/tests/replay-reconstruction-engine/helpers";
import { buildSnapshotFixture } from "@/tests/deterministic-snapshot-engine/helpers";
import { buildSafeActionFixture } from "@/tests/safe-action-catalog/helpers";

export function buildProposalFixture(overrides: Partial<{
  currentState: ProposalState;
  requestedTransition: ProposalTransition;
  actionId: string;
  autonomyLevel: "A0" | "A1" | "A2" | "A3" | "A4" | "A5" | "A6";
  approval: ProposalApproval;
  revocation: ProposalRevocation;
  metadata: Readonly<Record<string, unknown>>;
  lineage: ProposalLineageLedger;
}> = {}) {
  const governanceFixture = buildConstitutionalGovernanceFixture();
  const replayFixture = buildReplayFixture();
  const snapshotFixture = buildSnapshotFixture();
  const safeActionFixture = buildSafeActionFixture({
    actionId: overrides.actionId ?? "safe-action:prepare_handoff",
    autonomyLevel: overrides.autonomyLevel ?? "A1",
  });

  const governanceView = Object.freeze({
    ...governanceFixture.view,
    state: "ALLOW" as const,
    errors: Object.freeze([]),
    violations: Object.freeze([]),
    warnings: Object.freeze([]),
    autonomyBoundary: Object.freeze({
      ...governanceFixture.view.autonomyBoundary,
      decision: "ALLOW" as const,
      currentLevel: safeActionFixture.readinessProfile.autonomyLevel === "A6" ? "A5" : safeActionFixture.readinessProfile.autonomyLevel,
      ceilingLevel: safeActionFixture.readinessProfile.autonomyLevel === "A6" ? "A5" : safeActionFixture.readinessProfile.autonomyLevel,
    }),
  });

  const approval: ProposalApproval = overrides.approval ?? Object.freeze({
    approvalId: "proposal-approval-001",
    status: "approved",
    explicit: true,
    approvers: Object.freeze(["operator-01", "operator-02"]),
    approvedAt: "2026-05-16T15:00:00.000Z",
    expiresAt: "2026-05-16T16:00:00.000Z",
    scopeHash: "scope-hash-001",
    governanceDecisionHash: governanceView.constitutionalDecisionHash,
    valid: true,
  });

  const replay = Object.freeze({
    ...replayFixture.replay,
    status: "RECONSTRUCTED" as const,
    lineage: Object.freeze({
      ...replayFixture.replay.lineage,
      valid: true,
    }),
    integrity: Object.freeze({
      ...replayFixture.replay.integrity,
      deterministic: true,
      treatyBound: true,
      lineagePreserved: true,
      snapshotBound: true,
      validatorBound: true,
      valid: true,
    }),
  });

  const input: ProposalLifecycleInput = Object.freeze({
    proposalId: "proposal-001",
    missionId: "mission-001",
    executionId: "execution-001",
    createdAt: "2026-05-16T15:00:00.000Z",
    updatedAt: "2026-05-16T15:05:00.000Z",
    title: "Governed handoff preparation",
    summary: "Prepare a replay-safe handoff package without execution authority.",
    currentState: overrides.currentState ?? "draft",
    requestedTransition: overrides.requestedTransition ?? "validate",
    readinessProfile: safeActionFixture.readinessProfile,
    safeActionProfile: safeActionFixture.safeActionProfile,
    governanceView,
    replay,
    snapshots: Object.freeze([snapshotFixture.snapshot]),
    metadata: overrides.metadata,
    approval,
    revocation: overrides.revocation,
    lineage: overrides.lineage,
  });

  return {
    governanceFixture,
    replayFixture,
    replay,
    snapshotFixture,
    safeActionFixture,
    input,
    proposal: buildProposalLifecycleRecord(input),
  };
}

export function loadProposalLifecycleSources() {
  const root = path.resolve("services", "proposal-lifecycle-engine");
  return [
    "index.ts",
    "proposalLifecycleEngine.ts",
    "proposalStateMachine.ts",
    "proposalLifecycleSchemas.ts",
    "proposalLifecycleHasher.ts",
    "proposalLifecycleValidator.ts",
    "proposalLifecycleGuards.ts",
    "proposalGovernanceBinder.ts",
    "proposalReplayBinder.ts",
    "proposalSnapshotBinder.ts",
    "proposalSafeActionBinder.ts",
    "proposalApprovalEngine.ts",
    "proposalExpirationEngine.ts",
    "proposalRevocationEngine.ts",
    "proposalLineageLedger.ts",
    "proposalHandoffPreparer.ts",
    "proposalArchiveManager.ts",
    "proposalSerializer.ts",
    "proposalNormalizer.ts",
    "proposalErrors.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}
