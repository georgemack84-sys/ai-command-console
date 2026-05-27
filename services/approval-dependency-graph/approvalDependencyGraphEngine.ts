import type { ApprovalDependencyGraph, ApprovalDependencyGraphInput } from "@/types/approval-dependency-graph";
import { validateApprovalDependencySchema } from "./approvalDependencySchemas";
import { guardApprovalDependencyInput } from "./approvalDependencyGuards";
import { bindApprovalReplay } from "./approvalReplayBinder";
import { resolveApprovalDependencyNodes } from "./approvalDependencyResolver";
import { deriveApprovalInheritance } from "./approvalInheritanceEngine";
import { propagateApprovalRevocations } from "./approvalRevocationPropagator";
import { extractApprovalTimeWindows } from "./approvalTimeWindowEngine";
import { validateApprovalDependencyGraph } from "./approvalDependencyValidator";
import { appendApprovalDependencyLedger } from "./approvalDependencyLedger";
import { hashApprovalGraphValue } from "./approvalGraphHasher";

export function buildApprovalDependencyGraph(input: ApprovalDependencyGraphInput): ApprovalDependencyGraph {
  const schemaErrors = validateApprovalDependencySchema(input);
  const guardErrors = guardApprovalDependencyInput(input);
  const governanceHash = input.proposal.governanceBinding.governanceDecisionHash;
  const replay = bindApprovalReplay(input);
  const nodes = resolveApprovalDependencyNodes({
    proposal: input.proposal,
    governanceHash,
    replayHash: replay.reconstructionHash,
  });
  const inheritance = deriveApprovalInheritance({
    proposal: input.proposal,
    nodes,
  });
  const revoked = propagateApprovalRevocations({
    nodes,
    revoked: input.proposal.revocation.status === "revoked" || input.proposal.approval.status === "revoked",
    revokedAt: input.proposal.revocation.revokedAt,
  });
  const timeWindows = extractApprovalTimeWindows(revoked.nodes, input.generatedAt);
  const lifecycleErrors = validateApprovalDependencyGraph({
    graphInput: input,
    nodes: revoked.nodes,
    replay,
    inheritance,
    timeWindows,
    metadata: input.metadata,
  });
  const errors = Object.freeze([...schemaErrors, ...guardErrors, ...lifecycleErrors]);
  const lineageHash = hashApprovalGraphValue("approval-graph-lineage-hash", {
    proposalLineage: input.proposal.lineage.entries,
    governanceHash,
    replayLineageHash: replay.replayLineageHash,
    snapshotLineageHash: input.proposal.snapshotBinding.snapshotLineageHash,
  });
  const graphHash = hashApprovalGraphValue("approval-dependency-graph", {
    proposalId: input.proposal.proposalId,
    nodes: revoked.nodes,
    inheritance,
    revocations: revoked.propagations,
    replay,
    timeWindows,
    errors,
  });
  const lineage = appendApprovalDependencyLedger({
    existing: input.ledger,
    proposalId: input.proposal.proposalId,
    graphHash,
    replayHash: replay.reconstructionHash,
    lineageHash,
    timestamp: input.generatedAt,
  });

  return Object.freeze({
    graphId: hashApprovalGraphValue("approval-graph-id", {
      proposalId: input.proposal.proposalId,
      generatedAt: input.generatedAt,
    }),
    proposalId: input.proposal.proposalId,
    nodes: revoked.nodes,
    inheritance,
    revocations: revoked.propagations,
    replay,
    timeWindows,
    lineage,
    graphHash,
    replayHash: replay.reconstructionHash,
    lineageHash,
    derivedOnly: true,
    valid: errors.length === 0,
    warnings: Object.freeze([
      ...input.proposal.warnings,
      ...(input.proposal.safeActionBinding.futureBound ? ["Future-bound approval topology remains non-operational."] : []),
    ]),
    errors,
  });
}
