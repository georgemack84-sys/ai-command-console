import { readFileSync } from "node:fs";
import path from "node:path";

import { buildOverrideContract } from "@/services/human-override-contract";
import type { OverrideContractInput } from "@/services/human-override-contract";
import type { OverrideEvent } from "@/types/human-override-contract";
import { buildApprovalDependencyFixture } from "@/tests/approval-dependency-graph/helpers";

export function buildOverrideFixture(overrides: Partial<{
  events: readonly OverrideEvent[];
  metadata: Readonly<Record<string, unknown>>;
  autonomyLevel: "A0" | "A1" | "A2" | "A3" | "A4" | "A5" | "A6";
  actionId: string;
  currentState: "draft" | "validated" | "governance_review" | "approved" | "denied" | "prepared_handoff" | "archived" | "revoked";
  requestedTransition: "validate" | "submit_governance_review" | "approve" | "deny" | "prepare_handoff" | "archive" | "revoke";
}> = {}) {
  const approvalFixture = buildApprovalDependencyFixture({
    autonomyLevel: overrides.autonomyLevel,
    actionId: overrides.actionId,
    currentState: overrides.currentState,
    requestedTransition: overrides.requestedTransition,
    metadata: overrides.metadata,
  });

  const events: readonly OverrideEvent[] = overrides.events ?? Object.freeze([
    Object.freeze({
      overrideId: "override-001",
      timestamp: "2026-05-16T16:00:00.000Z",
      operatorId: "operator-01",
      operatorRole: "constitutional-operator",
      overrideType: "freeze",
      targetType: "proposal",
      targetId: approvalFixture.input.proposal.proposalId,
      reasonCode: "manual_review",
      justification: "Operator requested constitutional freeze.",
      authoritySnapshotHash: approvalFixture.input.proposal.governanceBinding.authorityLineageHash,
      governanceSnapshotHash: approvalFixture.input.proposal.governanceBinding.policySnapshotHash,
      approvalGraphHash: approvalFixture.graph.graphHash,
      createdAt: "2026-05-16T16:00:00.000Z",
    }),
  ]);

  const input: OverrideContractInput = Object.freeze({
    events,
    proposal: approvalFixture.input.proposal,
    approvalGraph: approvalFixture.graph,
    governanceView: approvalFixture.input.governanceView,
    replay: approvalFixture.input.replay,
    metadata: overrides.metadata,
  });

  return {
    approvalFixture,
    input,
    contract: buildOverrideContract(input),
  };
}

export function loadOverrideContractSources() {
  const root = path.resolve("services", "human-override-contract");
  return [
    "index.ts",
    "overrideContractEngine.ts",
    "overrideAuthorityValidator.ts",
    "overrideLineageLedger.ts",
    "freezeStateDeriver.ts",
    "killSwitchContract.ts",
    "overrideReplayBinder.ts",
    "overrideConflictResolver.ts",
    "overrideHasher.ts",
    "overrideSerializer.ts",
    "overrideNormalizer.ts",
    "overrideGuards.ts",
    "overrideSchemas.ts",
    "overrideErrors.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}
