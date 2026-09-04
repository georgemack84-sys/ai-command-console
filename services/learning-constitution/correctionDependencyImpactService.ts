import type { CorrectionDependencyImpact, CorrectionImpactAssessment, CorrectionRepository } from "../../types/learning-constitution/correctionLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { ProvenanceLedger, ProvenanceRelationship } from "../../types/learning-constitution/provenance";

const dependencyTypes = new Set<ProvenanceRelationship["type"]>(["DERIVED_FROM", "EXTRACTED_FROM", "INTERPRETED_AS", "REFERENCES", "SUPPORTED_BY", "NARROWS_SCOPE_OF", "EXCEPTION_OF"]);
type Input = Readonly<{ correctionId: string; targetIds: readonly string[]; analyzedAt: string; maxDepth?: number }>;

/** Traverses only explicit provenance links. Findings are review labels, never automatic invalidations. */
export class CorrectionDependencyImpactService {
  constructor(private readonly provenance: ProvenanceLedger, private readonly corrections?: CorrectionRepository, private readonly audit?: LearningAuditLedger) {}
  async analyze(input: Input, workspaceId: string, actor: { actorId: string; actorType: "HUMAN" | "AGENT" | "SYSTEM" | "EXTERNAL" }, correlationId: string): Promise<CorrectionImpactAssessment> {
    const records = await this.provenance.getAll(); const relationships = (await Promise.all(records.map((record) => this.provenance.getRelationships(record.id)))).flat();
    const links = [...new Map(relationships.map((link) => [link.id, link])).values()].filter((link) => dependencyTypes.has(link.type)); const maxDepth = input.maxDepth ?? 12;
    const impacts: CorrectionDependencyImpact[] = []; const seen = new Set<string>(); const queue = input.targetIds.map((targetId) => ({ targetId, currentId: targetId, path: [targetId] }));
    while (queue.length) {
      const current = queue.shift()!; if (current.path.length > maxDepth + 1) continue;
      for (const link of links.filter((candidate) => candidate.toId === current.currentId)) {
        const key = `${current.targetId}:${link.fromId}`; if (seen.has(key)) continue; seen.add(key);
        const affected = records.find((record) => record.id === link.fromId); if (!affected) continue;
        const path = [...current.path, affected.id]; const impact: CorrectionDependencyImpact = { impactId: `impact:${input.correctionId}:${current.targetId}:${affected.id}`, correctionId: input.correctionId, correctedTargetId: current.targetId, affectedRecordId: affected.id, affectedRecordType: affected.recordType, path, depth: path.length - 1, status: "POTENTIALLY_AFFECTED", detectedAt: input.analyzedAt, immutable: true };
        impacts.push(this.corrections ? await this.corrections.appendImpact(impact) : impact); queue.push({ targetId: current.targetId, currentId: affected.id, path });
      }
    }
    if (this.audit) await this.audit.append({ eventId: `audit:${input.correctionId}:dependency-impact:${input.analyzedAt}`, eventType: "DEPENDENCY_IMPACT_DETECTED", workspaceId, occurredAt: input.analyzedAt, actor, correlationId, schemaVersion: "10.0", references: { correctionIds: [input.correctionId], knowledgeIds: [...input.targetIds, ...impacts.map((impact) => impact.affectedRecordId)] }, payload: { targetCount: input.targetIds.length, impactCount: impacts.length, status: "POTENTIALLY_AFFECTED" } });
    return { correctionId: input.correctionId, impacts, analyzedAt: input.analyzedAt, immutable: true, persistenceEffect: this.corrections ? "CREATED" : "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
