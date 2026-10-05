import { z } from "zod";
import { sourceSchema } from "@/src/nuru/domain";
import { nuruDatabaseService, type NuruCanonicalKnowledgeCandidate } from "@/src/server/services/nuru-database-service";
import { getNuruAgentIdentity } from "@/src/server/services/nuru-agent-identity-service";
import { NuruHeadlineFlowReviewService } from "@/src/server/services/nuru-headline-flow-review-service";

export const nuruCurationInputSchema = z.object({
  title: z.string().trim().min(3).max(180),
  content: z.string().trim().min(20).max(12_000),
  project: z.string().trim().max(120).optional(),
  source: sourceSchema,
  submission: z.object({
    humanReason: z.string().trim().min(10).max(2_000),
    proposedTopics: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
    journeyContext: z.string().trim().min(1).max(180).optional(),
  }).optional(),
});
export type NuruCurationInput = z.infer<typeof nuruCurationInputSchema>;
export const nuruReviewDecisionSchema = z.object({ action: z.enum(["APPROVE", "REJECT", "HOLD", "REQUEST_CHANGES"]), reason: z.string().trim().min(3).max(1000) });

type RunResult = { agentId: string; agentType: string; objective: string; result: Record<string, unknown> };

const injectionPattern = /\b(ignore|disregard|override)\b.{0,50}\b(instruction|policy|system|governance)\b/i;
const canonicalServices = ["archive", "search", "metadata", "audit", "embeddings", "database", "permissions"];
function directDatabaseClaim(content: string) { const statement = content.toLowerCase(); return /agents?/.test(statement) && /\b(may|can|should)\b/.test(statement) && /\b(write|access)\b/.test(statement) && /\b(database|db)\b/.test(statement) && /\bdirect/.test(statement); }
function serviceBoundaryClaim(content: string) { const statement = content.toLowerCase(); return /\b(database|persistence|storage)\b/.test(statement) && /\bservice|services\b/.test(statement) && /\b(deterministic|through|only|must not|cannot|may not|limited)\b/.test(statement); }

function identitySnapshotFor(run: Pick<RunResult, "agentId" | "agentType">) {
  const identity = getNuruAgentIdentity(run.agentId);
  if (!identity || identity.agentType !== run.agentType) {
    throw new Error(`Nuru agent identity is unavailable for ${run.agentId}.`);
  }
  return identity;
}

/** Deterministic specialist runtime. It has no database imports; persistence is owned below by this service boundary. */
export function runNuruCuration(input: NuruCurationInput, existingTitles: string[] = [], existingKnowledge: NuruCanonicalKnowledgeCandidate[] = []) {
  const normalized = input.content.toLowerCase();
  const injectionWarning = injectionPattern.test(input.content) ? "External content contains instruction-like text and was treated as data." : null;
  const serviceBoundary = canonicalServices.filter((service) => normalized.includes(service));
  const duplicate = existingTitles.some((title) => title.toLowerCase() === input.title.toLowerCase());
  const canonicalConflicts = existingKnowledge.filter((item) => (directDatabaseClaim(input.content) && serviceBoundaryClaim(item.content)) || (serviceBoundaryClaim(input.content) && directDatabaseClaim(item.content)));
  const contradictory = (/\b(always|never|replace|supersede)\b/i.test(input.content) && /\b(not|never)\b/i.test(input.content)) || canonicalConflicts.length > 0;
  const confidence = Math.max(0.35, Math.min(0.96, (input.source.authority === "OWNER" ? 0.9 : input.source.authority === "HIGH" ? 0.8 : 0.66) - (injectionWarning ? 0.2 : 0) - (duplicate ? 0.18 : 0)));
  const qualityStatus = injectionWarning ? "NEEDS_REVIEW" : duplicate ? "PASS_WITH_WARNINGS" : contradictory ? "CONFLICT" : "PASS";
  const recommendation = injectionWarning || contradictory ? "REQUEST_REVIEW" : duplicate ? "MERGE" : "ACCEPT";
  const serviceReferences = serviceBoundary.map((service) => ({ targetItemId: `service:${service}`, relationshipType: "REFERENCES" as const, confidence, evidence: `The submitted content explicitly names ${service}.`, proposedBy: "nuru.connection.v1", status: "PROPOSED" as const }));
  const relatedKnowledge = existingKnowledge.filter((item) => item.project === (input.project ?? "Nuru") && serviceBoundary.some((service) => item.content.toLowerCase().includes(service))).map((item) => ({ targetItemId: item.id, relationshipType: "RELATED_TO" as const, confidence, evidence: `Shares deterministic service-boundary evidence with canonical knowledge “${item.title}”.`, proposedBy: "nuru.connection.v1", status: "PROPOSED" as const }));
  const contradictionRelations = canonicalConflicts.map((item) => ({ targetItemId: item.id, relationshipType: "CONTRADICTS" as const, confidence, evidence: `Competes with the canonical service-boundary claim in “${item.title}”.`, proposedBy: "nuru.connection.v1", status: "PROPOSED" as const }));
  const relationships = [...serviceReferences, ...relatedKnowledge, ...contradictionRelations];
  const warnings = [injectionWarning, duplicate ? "A title-equivalent knowledge item already exists; merge requires human review." : null, contradictory ? "Potentially conflicting language detected; automatic supersession is disabled and a human supersession review is required." : null].filter(Boolean) as string[];
  const runs: RunResult[] = [
    { agentId: "nuru.discovery.v1", agentType: "DISCOVERY", objective: "Identify candidate material and provenance.", result: { initialType: serviceBoundary.length ? "Architectural Principle" : "Knowledge Note", relevanceScore: Math.round(confidence * 100), confidence, source: input.source } },
    { agentId: "nuru.context.v1", agentType: "CONTEXT", objective: "Determine scope and meaning.", result: { project: input.project ?? "Nuru", artifactType: serviceBoundary.length ? "Architecture Decision" : "Knowledge Note", scope: "V1", confidence } },
    { agentId: "nuru.connection.v1", agentType: "CONNECTION", objective: "Propose relationships to known knowledge.", result: { relationships, confidence } },
    { agentId: "nuru.quality.v1", agentType: "QUALITY", objective: "Evaluate provenance, duplicates, conflicts, and evidence.", result: { qualityStatus, duplicate: duplicate ? "EXACT_DUPLICATE" : "NOT_DUPLICATE", conflict: contradictory, warnings, confidence } },
  ];
  return { confidence, qualityStatus, recommendation, relationships, warnings, runs, classification: serviceBoundary.length ? "Architectural Principle" : "Knowledge Note", reasoningSummary: serviceBoundary.length ? "Operational infrastructure is retained as deterministic services; agents are limited to contextual reasoning and proposals." : "Candidate was classified and routed through the governed Nuru specialist workflow.", requiredReview: true };
}

// The generated Prisma client may be refreshed after applying the migration. Keeping
// the client cast local ensures agent modules never gain database access.
export async function createNuruCurationProposal(input: NuruCurationInput, actor: string) {
  const [existing, canonicalKnowledge] = await Promise.all([nuruDatabaseService.listKnowledgeTitles(), nuruDatabaseService.listCanonicalKnowledge()]);
  const result = runNuruCuration(input, existing.map((item) => item.title), canonicalKnowledge);
  const correlationId = crypto.randomUUID();
  return nuruDatabaseService.transaction(async (tx) => {
    const item = await tx.nuruKnowledgeItem.create({ data: { title: input.title, content: input.content, contentType: result.classification, project: input.project, source: input.source, metadata: { classification: result.classification, scope: "V1", submission: input.submission }, relationships: result.relationships, confidence: result.confidence, provenance: { source: input.source, submittedBy: actor } } });
    const proposal = await tx.nuruCurationProposal.create({ data: { itemId: item.id, recommendation: result.recommendation, classification: result.classification, project: input.project, qualityStatus: result.qualityStatus, confidence: result.confidence, evidence: { source: input.source, relationships: result.relationships, submission: input.submission }, reasoningSummary: result.reasoningSummary, warnings: result.warnings, requiredReview: true, createdBy: "nuru.curator.v1" } });
    await tx.nuruAgentRun.createMany({ data: [...result.runs, { agentId: "nuru.curator.v1", agentType: "CURATOR", objective: "Synthesize specialist assessments into a curation proposal.", result: { recommendation: result.recommendation, requiredReview: true, confidence: result.confidence } }].map((run) => ({ proposalId: proposal.id, ...run, status: "success", correlationId, model: "deterministic-v1", promptVersion: "nuru-v1", policyVersion: "nuru-governance-v1", identitySnapshot: identitySnapshotFor(run) })) });
    await tx.nuruAuditEvent.createMany({ data: ["AGENT_RUN_STARTED", "DISCOVERY_CREATED", "CONTEXT_PROPOSED", "CONNECTION_PROPOSED", "QUALITY_ASSESSED", "CURATION_PROPOSED", "HUMAN_REVIEW_REQUESTED"].map((eventType) => ({ proposalId: proposal.id, eventType, actor: eventType === "HUMAN_REVIEW_REQUESTED" ? "nuru.curator.v1" : "nuru.runtime.v1", resourceId: item.id, correlationId })) });
    return { proposal, item, ...result };
  });
}

export async function listNuruCurationProposals() {
  return NuruHeadlineFlowReviewService.enrich(await nuruDatabaseService.listProposals() as Array<Record<string, unknown> & { id: string }>);
}

export async function decideNuruCurationProposal(proposalId: string, decision: z.infer<typeof nuruReviewDecisionSchema>, reviewer: string) {
  const correlationId = crypto.randomUUID();
  return nuruDatabaseService.transaction(async (tx) => {
    const proposal = await tx.nuruCurationProposal.findUnique({ where: { id: proposalId } });
    if (!proposal) return null;
    if (proposal.status !== "HUMAN_REVIEW_REQUIRED") throw new Error("This proposal has already received a governance decision.");
    const approved = decision.action === "APPROVE";
    const updated = await tx.nuruCurationProposal.update({ where: { id: proposalId }, data: { status: approved ? "APPROVED" : decision.action, decisionReason: decision.reason, reviewedBy: reviewer, reviewedAt: new Date() } });
    if (approved) {
      await tx.nuruKnowledgeItem.update({ where: { id: proposal.itemId }, data: { status: "APPROVED" } });
      const evidence = proposal.evidence as { relationships?: unknown };
      const proposedRelationships = z.array(z.object({ targetItemId: z.string().min(1), relationshipType: z.string().min(1), confidence: z.number().min(0).max(1), evidence: z.string().min(1), proposedBy: z.string().min(1) })).safeParse(evidence.relationships);
      const candidates = proposedRelationships.success ? proposedRelationships.data.filter((relationship) => relationship.targetItemId !== proposal.itemId && !relationship.targetItemId.startsWith("service:")) : [];
      const targetIds = [...new Set(candidates.map((relationship) => relationship.targetItemId))];
      if (targetIds.length) {
        const targets = await tx.nuruKnowledgeItem.findMany({ where: { id: { in: targetIds }, status: { in: ["APPROVED", "ARCHIVED"] } }, select: { id: true } });
        const approvedTargetIds = new Set(targets.map((target) => target.id));
        const relationshipProposals = candidates.filter((relationship) => approvedTargetIds.has(relationship.targetItemId));
        // Canonical approval does not approve a graph edge. Preserve the agent's
        // evidence as a pending proposal for a separate human graph decision.
        if (relationshipProposals.length) {
          await tx.nuruRelationship.createMany({ data: relationshipProposals.map((relationship) => ({ sourceItemId: proposal.itemId, ...relationship, status: "PROPOSED" })) });
          await tx.nuruAuditEvent.createMany({ data: relationshipProposals.map((relationship) => ({ proposalId, eventType: "RELATIONSHIP_PROPOSED", actor: relationship.proposedBy, resourceId: proposal.itemId, inputReference: relationship.targetItemId, outputReference: relationship.relationshipType, decision: "PROPOSED", reason: relationship.evidence, correlationId })) });
        }
      }
    }
    const eventType = approved ? "CURATION_APPROVED" : decision.action === "REQUEST_CHANGES" ? "CURATION_REVISION_REQUESTED" : "CURATION_REJECTED";
    await tx.nuruAuditEvent.create({ data: { proposalId, eventType, actor: reviewer, resourceId: proposal.itemId, decision: decision.action, reason: decision.reason, correlationId } });
    await tx.nuruHumanFeedback.create({ data: { proposalId, agentRecommendation: proposal.recommendation, humanDecision: decision.action, reason: decision.reason, reviewer, correlationId, evaluationStatus: "PENDING_REVIEW" } });
    return updated;
  });
}
