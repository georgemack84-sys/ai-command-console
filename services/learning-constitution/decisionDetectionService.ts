import type { DecisionCandidate } from "../../types/learning-constitution/decisionLearning";
import type { KnowledgeScopeReference } from "../../types/learning-constitution/knowledgeScope";
import type { ProvenanceActor } from "../../types/learning-constitution/provenance";
/** Conservative extractor: only explicit alternatives plus a reason form a candidate. */
export class DecisionDetectionService {
  detect(input: Readonly<{ decisionId: string; statement: string; scope: readonly KnowledgeScopeReference[]; provenanceId: string; actor: ProvenanceActor; occurredAt: string }>): DecisionCandidate | null {
    const match = input.statement.match(/considered\s+(.+?)\s+and\s+(.+?)[.!]?\s*(?:let'?s\s+)?use\s+(.+?)\s+because\s+(.+?)(?:\.|$)/i); if (!match || !input.scope.length) return null;
    const [, first, second, selected, rationale] = match; const selectedOption = selected.trim(); const alternatives = [first.trim(), second.trim()];
    return { decisionId: input.decisionId, problem: "Explicitly stated choice", context: input.statement, scope: input.scope, constraints: [], assumptions: [], options: alternatives.map((option, index) => ({ optionId: `${input.decisionId}:option:${index + 1}`, description: option, disposition: option.toLowerCase() === selectedOption.toLowerCase() ? "SELECTED" : "REJECTED", rejectionReason: option.toLowerCase() === selectedOption.toLowerCase() ? undefined : `Selected ${selectedOption} instead.` })), rationale: rationale.trim(), tradeoffs: [], principleIds: [], preferenceIds: [], provenanceIds: [input.provenanceId], authority: input.actor.actorType === "HUMAN" ? "HUMAN_DECISION" : "AGENT_RECOMMENDATION", status: "CANDIDATE", significant: true, universalClaim: false, createdBy: input.actor, createdAt: input.occurredAt, immutable: true, executionPermissionGranted: false };
  }
}
