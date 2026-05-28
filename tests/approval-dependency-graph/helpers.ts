import { readFileSync } from "node:fs";
import path from "node:path";

import { buildApprovalDependencyGraph } from "@/services/approval-dependency-graph";
import type { ApprovalDependencyGraphInput } from "@/types/approval-dependency-graph";
import { buildProposalFixture } from "@/tests/proposal-lifecycle-engine/helpers";

export function buildApprovalDependencyFixture(overrides: Partial<{
  currentState: "draft" | "validated" | "governance_review" | "approved" | "denied" | "prepared_handoff" | "archived" | "revoked";
  requestedTransition: "validate" | "submit_governance_review" | "approve" | "deny" | "prepare_handoff" | "archive" | "revoke";
  actionId: string;
  autonomyLevel: "A0" | "A1" | "A2" | "A3" | "A4" | "A5" | "A6";
  metadata: Readonly<Record<string, unknown>>;
}> = {}) {
  const proposalFixture = buildProposalFixture({
    currentState: overrides.currentState,
    requestedTransition: overrides.requestedTransition,
    actionId: overrides.actionId,
    autonomyLevel: overrides.autonomyLevel,
    metadata: overrides.metadata,
  });

  const input: ApprovalDependencyGraphInput = Object.freeze({
    proposal: proposalFixture.proposal,
    governanceView: proposalFixture.input.governanceView,
    replay: proposalFixture.replay,
    snapshots: proposalFixture.input.snapshots,
    generatedAt: proposalFixture.input.updatedAt,
    metadata: overrides.metadata,
  });

  return {
    proposalFixture,
    input,
    graph: buildApprovalDependencyGraph(input),
  };
}

export function loadApprovalDependencyGraphSources() {
  const root = path.resolve("services", "approval-dependency-graph");
  return [
    "index.ts",
    "approvalDependencyGraphEngine.ts",
    "approvalDependencyResolver.ts",
    "approvalDependencyValidator.ts",
    "approvalInheritanceEngine.ts",
    "approvalRevocationPropagator.ts",
    "approvalReplayBinder.ts",
    "approvalTimeWindowEngine.ts",
    "approvalGraphHasher.ts",
    "approvalGraphSerializer.ts",
    "approvalGraphNormalizer.ts",
    "approvalDependencyLedger.ts",
    "approvalDependencyGuards.ts",
    "approvalDependencySchemas.ts",
    "approvalDependencyErrors.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}
