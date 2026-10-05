import { z } from "zod";
import { relationshipSchema, relationshipTypes } from "@/src/nuru/domain";
import { AppError } from "@/src/server/api/errors";
import { nuruKnowledgeRepository, type NuruArchiveModel } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";

export const graphRelationshipSchema = relationshipSchema.extend({ sourceItemId: z.string().min(1), status: z.literal("PROPOSED").default("PROPOSED") });
export const graphRelationshipProposalSchema = graphRelationshipSchema.omit({ proposedBy: true, status: true });
export const graphRelationshipApprovalSchema = z.object({ sourceItemId: z.string().min(1), targetItemId: z.string().min(1), relationshipType: z.enum(relationshipTypes), reason: z.string().trim().min(3).max(2_000).default("Approved by the human governor for a governed Discover path.") });
export const graphRelationshipReviewDecisionSchema = z.object({ decision: z.enum(["APPROVE", "REJECT", "HOLD", "REVOKE"]), reason: z.string().trim().min(3).max(2_000) });
export const graphTraversalSchema = z.object({ itemId: z.string().min(1), depth: z.number().int().min(1).max(4).default(1), relationshipTypes: z.array(z.enum(relationshipTypes)).max(20).optional(), includeProposed: z.boolean().default(false) });
export type GraphRelationship = z.infer<typeof graphRelationshipSchema>;
export type GraphTraversal = z.infer<typeof graphTraversalSchema>;

/** Deterministic graph storage and traversal; agents propose edges but do not validate or approve them. */
export const NuruGraphService = {
  async propose(rawRelationship: GraphRelationship, correlationId: string) {
    const relationship = graphRelationshipSchema.parse(rawRelationship);
    await nuruKnowledgeRepository.nuruRelationship.createMany({ data: [relationship] });
    await NuruAuditService.record({ operation: "RELATIONSHIP_PROPOSED", actor: relationship.proposedBy, resourceId: relationship.sourceItemId, inputReference: relationship.targetItemId, outputReference: relationship.relationshipType, decision: "PROPOSED", reason: "Stored as a graph proposal; validation is still required.", correlationId });
    return relationship;
  },

  async proposeFromGovernor(rawRelationship: unknown, actor: string, correlationId: string) {
    const proposal = graphRelationshipProposalSchema.parse(rawRelationship);
    if (proposal.sourceItemId === proposal.targetItemId) throw new AppError(400, "invalid_relationship", "A relationship must connect two different knowledge records.");
    const existing = await nuruKnowledgeRepository.nuruRelationship.findMany({ where: { sourceItemId: proposal.sourceItemId, targetItemId: proposal.targetItemId, relationshipType: proposal.relationshipType, status: { in: ["PROPOSED", "APPROVED"] } }, take: 1 });
    if (existing.length) throw new AppError(409, "relationship_exists", "This relationship is already proposed or approved.");
    return this.propose({ ...proposal, proposedBy: actor, status: "PROPOSED" }, correlationId);
  },

  async approveFromGovernor(rawApproval: unknown, actor: string, correlationId: string) {
    const approval = graphRelationshipApprovalSchema.parse(rawApproval);
    const matches = await nuruKnowledgeRepository.nuruRelationship.findMany({ where: { sourceItemId: approval.sourceItemId, targetItemId: approval.targetItemId, relationshipType: approval.relationshipType, status: "PROPOSED" }, take: 1 });
    const relationship = matches[0];
    if (!relationship) throw new AppError(404, "relationship_proposal_not_found", "No pending relationship proposal matches this approval.");
    const approved = await nuruKnowledgeRepository.nuruRelationship.update({ where: { id: relationship.id }, data: { status: "APPROVED" } });
    await NuruAuditService.record({ operation: "RELATIONSHIP_APPROVED", actor, resourceId: relationship.sourceItemId, inputReference: relationship.targetItemId, outputReference: relationship.relationshipType, decision: "APPROVED", reason: approval.reason, correlationId });
    return approved;
  },

  async listPendingReviews(limit = 50) {
    const relationships = await nuruKnowledgeRepository.nuruRelationship.findMany({ where: { status: "PROPOSED" }, orderBy: { createdAt: "asc" }, take: Math.max(1, Math.min(limit, 100)) });
    if (!relationships.length) return [];
    const archive = nuruKnowledgeRepository.nuruKnowledgeItem as unknown as NuruArchiveModel;
    const items = await archive.findMany({ where: { id: { in: [...new Set(relationships.flatMap((relationship) => [relationship.sourceItemId, relationship.targetItemId]))] } }, take: 200 });
    const titles = new Map(items.map((item) => [item.id, item.title]));
    return relationships.map((relationship) => ({ ...relationship, sourceTitle: titles.get(relationship.sourceItemId) ?? "Unknown record", targetTitle: titles.get(relationship.targetItemId) ?? "Unknown record" }));
  },

  async historyForItem(itemId: string, limit = 100) {
    const relationships = await nuruKnowledgeRepository.nuruRelationship.findMany({ where: { OR: [{ sourceItemId: itemId }, { targetItemId: itemId }] }, orderBy: { createdAt: "desc" }, take: Math.max(1, Math.min(limit, 100)) });
    if (!relationships.length) return [];
    const archive = nuruKnowledgeRepository.nuruKnowledgeItem as unknown as NuruArchiveModel;
    const items = await archive.findMany({ where: { id: { in: [...new Set(relationships.flatMap((relationship) => [relationship.sourceItemId, relationship.targetItemId]))] } }, take: 250 });
    const titles = new Map(items.map((item) => [item.id, item.title]));
    const audits = await nuruKnowledgeRepository.nuruAuditEvent.findMany({
      where: {
        eventType: { in: ["RELATIONSHIP_PROPOSED", "RELATIONSHIP_APPROVED", "RELATIONSHIP_REJECTED", "RELATIONSHIP_REVIEWED"] },
        OR: relationships.map((relationship) => ({ resourceId: relationship.sourceItemId, inputReference: relationship.targetItemId, outputReference: relationship.relationshipType })),
      },
      orderBy: { createdAt: "asc" },
      take: 500,
    });
    return relationships.map((relationship) => ({
      ...relationship,
      sourceTitle: titles.get(relationship.sourceItemId) ?? "Unknown record",
      targetTitle: titles.get(relationship.targetItemId) ?? "Unknown record",
      auditTrail: audits.filter((audit) => audit.resourceId === relationship.sourceItemId && audit.inputReference === relationship.targetItemId && audit.outputReference === relationship.relationshipType),
    }));
  },

  async decideReview(relationshipId: string, rawDecision: unknown, actor: string, correlationId: string) {
    const decision = graphRelationshipReviewDecisionSchema.parse(rawDecision);
    const matches = await nuruKnowledgeRepository.nuruRelationship.findMany({ where: { id: relationshipId }, take: 1 });
    const relationship = matches[0];
    if (!relationship) throw new AppError(404, "relationship_proposal_not_found", "Relationship proposal not found.");
    const revokingApproved = decision.decision === "REVOKE";
    if (revokingApproved ? relationship.status !== "APPROVED" : relationship.status !== "PROPOSED") {
      throw new AppError(409, "relationship_not_reviewable", revokingApproved ? "Only approved relationships can be revoked." : "Only pending relationship proposals can be reviewed.");
    }
    if (decision.decision === "HOLD") {
      await NuruAuditService.record({ operation: "RELATIONSHIP_REVIEWED", actor, resourceId: relationship.sourceItemId, inputReference: relationship.targetItemId, outputReference: relationship.relationshipType, decision: "HOLD", reason: decision.reason, correlationId });
      return relationship;
    }
    const status = decision.decision === "APPROVE" ? "APPROVED" : "REJECTED";
    const reviewed = await nuruKnowledgeRepository.nuruRelationship.update({ where: { id: relationship.id }, data: { status } });
    await NuruAuditService.record({ operation: status === "APPROVED" ? "RELATIONSHIP_APPROVED" : "RELATIONSHIP_REJECTED", actor, resourceId: relationship.sourceItemId, inputReference: relationship.targetItemId, outputReference: relationship.relationshipType, decision: revokingApproved ? "REVOKED" : status, reason: decision.reason, correlationId });
    return reviewed;
  },

  async proposeBatch(rawRelationships: GraphRelationship[], correlationId: string) {
    const relationships = z.array(graphRelationshipSchema).max(100).parse(rawRelationships);
    if (!relationships.length) return { count: 0 };
    await nuruKnowledgeRepository.nuruRelationship.createMany({ data: relationships });
    await Promise.all(relationships.map((relationship) => NuruAuditService.record({ operation: "RELATIONSHIP_PROPOSED", actor: relationship.proposedBy, resourceId: relationship.sourceItemId, inputReference: relationship.targetItemId, outputReference: relationship.relationshipType, decision: "PROPOSED", reason: "Stored as a graph proposal; validation is still required.", correlationId })));
    return { count: relationships.length };
  },

  async traverse(rawTraversal: GraphTraversal) {
    const query = graphTraversalSchema.parse(rawTraversal); const seen = new Set([query.itemId]); const edges: Array<{ sourceItemId: string; targetItemId: string; relationshipType: string; confidence: number; status: string }> = []; let frontier = [query.itemId];
    for (let level = 0; level < query.depth && frontier.length; level += 1) {
      const found = await nuruKnowledgeRepository.nuruRelationship.findMany({ where: { OR: [{ sourceItemId: { in: frontier } }, { targetItemId: { in: frontier } }], ...(query.relationshipTypes ? { relationshipType: { in: query.relationshipTypes } } : {}), ...(query.includeProposed ? {} : { status: "APPROVED" }) } });
      const next: string[] = [];
      for (const edge of found) { edges.push(edge); const neighbor = frontier.includes(edge.sourceItemId) ? edge.targetItemId : edge.sourceItemId; if (!seen.has(neighbor)) { seen.add(neighbor); next.push(neighbor); } }
      frontier = next;
    }
    return { rootItemId: query.itemId, nodes: [...seen], edges };
  },

  async history(itemId: string) { return this.traverse({ itemId, depth: 1, includeProposed: true }); },
};
