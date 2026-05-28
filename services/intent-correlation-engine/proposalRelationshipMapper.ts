import type {
  CorrelationReplayBinding,
  CorrelationRelationshipKind,
  CorrelationStrength,
  IntentCorrelationRelationship,
  IntentCorrelationError,
} from "@/types/intent-correlation-engine";
import type { IntentCoordinationGovernanceRecord } from "@/types/intent-coordination-governance-core";
import { buildCorrelationBoundary } from "./correlationSchemas";
import { createCorrelationError } from "./correlationErrors";
import { hashCorrelationValue } from "./correlationHasher";

function classifyKind(relationshipType: string): CorrelationRelationshipKind {
  switch (relationshipType) {
    case "approval":
      return "approval-related";
    case "observation":
      return "confidence-trajectory-related";
    case "escalation":
      return "escalation-related";
    case "reference":
      return "evidence-context-related";
    default:
      return "governance-outcome-related";
  }
}

function classifyStrength(reasonCodes: readonly string[]): CorrelationStrength {
  if (reasonCodes.length >= 3) {
    return "strong";
  }
  if (reasonCodes.length === 2) {
    return "moderate";
  }
  return "weak";
}

export function mapProposalRelationships(input: {
  coordinationRecords: readonly IntentCoordinationGovernanceRecord[];
  replayBinding: CorrelationReplayBinding;
  createdAt: string;
}): Readonly<{
  relationships: readonly IntentCorrelationRelationship[];
  errors: readonly IntentCorrelationError[];
}> {
  const errors: IntentCorrelationError[] = [];
  const relationships: IntentCorrelationRelationship[] = [];

  for (const record of input.coordinationRecords) {
    const proposalIdByIntentId = new Map(record.topology.nodes.map((node) => [node.intentId, node.proposalId]));
    for (const relationship of [...record.topology.relationships].sort((left, right) => left.relationshipId.localeCompare(right.relationshipId))) {
      if (/execute|dispatch|schedule|workflow|activate|run/i.test(relationship.relationshipType)) {
        errors.push(createCorrelationError(
          "PHASE_4_6B_CORRELATION_EXECUTION_LEAKAGE_REJECTED",
          "Execution-like relationship names are forbidden in intent correlation.",
          `relationships.${relationship.relationshipId}.relationshipType`,
        ));
        continue;
      }
      const reasonCodes = Object.freeze([
        relationship.relationshipType,
        "explicit-topology-relationship",
        record.governanceSchema.readinessLevel,
      ]);
      const sourceProposalId = proposalIdByIntentId.get(relationship.parentIntentId);
      const targetProposalId = proposalIdByIntentId.get(relationship.childIntentId);
      if (!sourceProposalId || !targetProposalId) {
        errors.push(createCorrelationError(
          "PHASE_4_6B_CORRELATION_AMBIGUOUS_TOPOLOGY",
          "Correlation requires explicit proposal ids for both relationship endpoints.",
          `relationships.${relationship.relationshipId}`,
        ));
        continue;
      }
      relationships.push(Object.freeze({
        correlationId: hashCorrelationValue("intent-correlation-relationship-id", {
          relationshipId: relationship.relationshipId,
          replayBindingId: input.replayBinding.replayBindingId,
        }),
        sourceProposalId,
        targetProposalId,
        relationshipKind: classifyKind(relationship.relationshipType),
        strength: classifyStrength(reasonCodes),
        reasonCodes,
        governanceState:
          record.state === "frozen" || record.state === "revoked" || record.state === "archived" ? "blocked"
          : record.state === "escalated" ? "restricted"
          : record.state === "reviewed" ? "review"
          : "normal",
        boundary: buildCorrelationBoundary(),
        replayBindingId: input.replayBinding.replayBindingId,
        createdAt: input.createdAt,
        correlationHash: hashCorrelationValue("intent-correlation-relationship", {
          relationshipId: relationship.relationshipId,
          recordHash: record.coordinationHash,
          replayBindingId: input.replayBinding.replayBindingId,
        }),
      }));
    }
  }

  return Object.freeze({
    relationships: Object.freeze(relationships.sort((left, right) => left.correlationId.localeCompare(right.correlationId))),
    errors: Object.freeze(errors),
  });
}
