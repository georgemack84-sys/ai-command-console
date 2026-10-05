import { z } from "zod";
import { relationshipTypes, sourceSchema } from "@/src/nuru/domain";
import { nuruKnowledgeRepository, type ArchiveKnowledgeRow } from "@/src/server/repositories/nuru-knowledge-repository";
import type { NuruArchiveModel } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruPermissionsService } from "@/src/server/services/nuru-permissions-service";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";
import { NuruSourceService } from "@/src/server/services/nuru-source-service";
import { NuruProvenanceService, provenanceChainSchema } from "@/src/server/services/nuru-provenance-service";

const archiveStatuses = ["APPROVED", "ARCHIVED", "SUPERSEDED"] as const;
export const archiveItemSchema = z.object({ title: z.string().trim().min(1).max(180), content: z.string().trim().min(1), contentType: z.string().trim().min(1), project: z.string().trim().max(120).optional(), source: sourceSchema, confidence: z.number().min(0).max(1), metadata: z.record(z.string(), z.unknown()).default({}), tags: z.array(z.string()).default([]), relatedProjects: z.array(z.string()).default([]), lineage: provenanceChainSchema.optional() });
export type ArchiveItemInput = z.infer<typeof archiveItemSchema>;

function archiveId() { return `K-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`; }
function asArchiveRow(row: ArchiveKnowledgeRow | null) { return row; }
const archiveRepository = nuruKnowledgeRepository.nuruKnowledgeItem as unknown as NuruArchiveModel;
function requireArchivePermission(subject: string, action: "ARCHIVE" | "SUPERSEDE") { const decision = NuruPermissionsService.authorize({ subject, resource: "archive", action, context: { correlationId: crypto.randomUUID(), purpose: "Perform an approved durable Nuru archive operation." } }); if (!decision.allowed) throw new Error(`Permission denied: ${decision.reason}`); }

/** Durable knowledge service. It is the only Nuru API allowed to version or restore archived knowledge. */
export const NuruArchiveService = {
  async store(input: ArchiveItemInput, actor: string) {
    requireArchivePermission(actor, "ARCHIVE"); const { lineage = [], ...archiveInput } = archiveItemSchema.parse(input); const id = archiveId();
    const source = await NuruSourceService.register(archiveInput.source, actor, crypto.randomUUID());
    const item = await archiveRepository.create({ data: { id, ...archiveInput, source, sourceId: source.sourceId, status: "ARCHIVED", currentVersion: 1, relationships: [], provenance: { source, submittedBy: actor, transformations: [] } } });
    await NuruProvenanceService.record(item.id, { stage: "SOURCE", referenceId: source.sourceId, actor: "nuru.source.v1", details: { sourceType: source.sourceType } }, lineage, crypto.randomUUID());
    await NuruAuditService.record({ operation: "KNOWLEDGE_ARCHIVED", actor, resourceId: item.id, inputReference: archiveInput.source.origin, outputReference: item.id, decision: "ARCHIVED", reason: "Approved archive operation.", correlationId: crypto.randomUUID() });
    return item;
  },
  /** Finalizes the already-materialized, human-approved item; it never creates a successor record. */
  async archiveExisting(id: string, actor: string, correlationId = crypto.randomUUID()) {
    requireArchivePermission(actor, "ARCHIVE"); const item = await this.retrieve(id); if (!item) return null; if (!["READY_FOR_REVIEW", "APPROVED"].includes(item.status)) throw new Error(`Knowledge item ${id} cannot be archived from ${item.status}.`);
    const source = await NuruSourceService.register(sourceSchema.parse(item.source), actor, correlationId); const archived = await archiveRepository.update({ where: { id }, data: { source, sourceId: source.sourceId, status: "ARCHIVED", provenance: { ...(item.provenance as Record<string, unknown>), source, archivedBy: actor, archivedAt: new Date().toISOString() } } });
    await NuruAuditService.record({ operation: "KNOWLEDGE_ARCHIVED", actor, resourceId: id, inputReference: source.origin, outputReference: id, decision: "ARCHIVED", reason: "Human-approved existing knowledge item archived without creating a duplicate record.", correlationId }); return archived;
  },
  async retrieve(id: string) { return asArchiveRow(await archiveRepository.findUnique({ where: { id } })); },
  async version(previousId: string, input: ArchiveItemInput, actor: string) {
    requireArchivePermission(actor, "SUPERSEDE"); const { lineage = [], ...archiveInput } = archiveItemSchema.parse(input); const previous = await this.retrieve(previousId); if (!previous) return null; const id = archiveId(); const source = await NuruSourceService.register(archiveInput.source, actor, crypto.randomUUID());
    const next = await nuruKnowledgeRepository.$transaction(async (tx) => { const archiveTx = tx.nuruKnowledgeItem as unknown as NuruArchiveModel; const next = await archiveTx.create({ data: { id, ...archiveInput, source, sourceId: source.sourceId, status: "ARCHIVED", currentVersion: previous.currentVersion + 1, relationships: [], provenance: { source, submittedBy: actor, transformations: [{ actor, action: "VERSIONED_FROM", at: new Date().toISOString() }] } } }); await archiveTx.update({ where: { id: previousId }, data: { status: "SUPERSEDED" } }); await tx.nuruRelationship.createMany({ data: [{ sourceItemId: id, targetItemId: previousId, relationshipType: "SUPERSEDES", confidence: 1, evidence: "Explicit archive version operation.", proposedBy: actor, status: "APPROVED" }, { sourceItemId: previousId, targetItemId: id, relationshipType: "SUPERSEDED_BY", confidence: 1, evidence: "Explicit archive version operation.", proposedBy: actor, status: "APPROVED" }] }); await NuruAuditService.record({ operation: "KNOWLEDGE_SUPERSEDED", actor, resourceId: previousId, inputReference: previousId, outputReference: next.id, decision: "SUPERSEDED", reason: "Explicit version operation created a successor.", correlationId: crypto.randomUUID() }); return next; });
    await NuruProvenanceService.record(next.id, { stage: "SOURCE", referenceId: source.sourceId, actor: "nuru.source.v1", details: { sourceType: source.sourceType } }, lineage, crypto.randomUUID()); return next;
  },
  async supersede(previousId: string, input: ArchiveItemInput, actor: string) { return this.version(previousId, input, actor); },
  async activateSupersession(currentItemId: string, successorItemId: string, actor: string) {
    requireArchivePermission(actor, "SUPERSEDE"); if (currentItemId === successorItemId) throw new Error("A knowledge item cannot supersede itself."); const [current, successor] = await Promise.all([this.retrieve(currentItemId), this.retrieve(successorItemId)]); if (!current || !successor) throw new Error("Both current and successor knowledge items must exist.");
    await nuruKnowledgeRepository.$transaction(async (tx) => { const archiveTx = tx.nuruKnowledgeItem as unknown as NuruArchiveModel; await archiveTx.update({ where: { id: currentItemId }, data: { status: "SUPERSEDED" } }); await archiveTx.update({ where: { id: successorItemId }, data: { status: "ARCHIVED" } }); await tx.nuruRelationship.createMany({ data: [{ sourceItemId: successorItemId, targetItemId: currentItemId, relationshipType: "SUPERSEDES", confidence: 1, evidence: "Approved supersession review.", proposedBy: actor, status: "APPROVED" }, { sourceItemId: currentItemId, targetItemId: successorItemId, relationshipType: "SUPERSEDED_BY", confidence: 1, evidence: "Approved supersession review.", proposedBy: actor, status: "APPROVED" }] }); });
    await NuruAuditService.record({ operation: "KNOWLEDGE_SUPERSEDED", actor, resourceId: currentItemId, inputReference: currentItemId, outputReference: successorItemId, decision: "SUPERSEDED", reason: "Human-reviewed supersession preserved both historical records.", correlationId: crypto.randomUUID() }); return { currentItemId, successorItemId, currentStatus: "SUPERSEDED" as const, successorStatus: "ARCHIVED" as const };
  },
  async restore(id: string, actor: string) { requireArchivePermission(actor, "ARCHIVE"); const item = await this.retrieve(id); if (!item || !archiveStatuses.includes(item.status as (typeof archiveStatuses)[number])) return null; const restored = await archiveRepository.update({ where: { id }, data: { status: "ARCHIVED" } }); await NuruAuditService.record({ operation: "KNOWLEDGE_RESTORED", actor, resourceId: id, outputReference: restored.id, decision: "RESTORED", reason: "Approved archive restore operation.", correlationId: crypto.randomUUID() }); return restored; },
  async history(id: string) { const item = await this.retrieve(id); if (!item) return []; return nuruKnowledgeRepository.nuruRelationship.findMany({ where: { OR: [{ sourceItemId: id }, { targetItemId: id }], relationshipType: { in: ["SUPERSEDES", "SUPERSEDED_BY", "DERIVED_FROM", "RELATED_TO", "EXPANDS", "CONTRADICTS", "REFERENCES"] } } }); },
};

export const archiveRelationshipTypes = relationshipTypes;
