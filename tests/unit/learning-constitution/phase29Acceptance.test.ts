import { describe, expect, it } from "vitest";
import { InMemoryLearningAuditLedger, SourceAssessmentService, SourceCriticismAuditService, SourceCriticismEngine, SourceCriticismGateAdvisor, SourceRegistryService } from "@/services/learning-constitution";
import type { ClaimEvidenceLink, SourceAssessment, SourceCriticismArtifactRecord, SourceCriticismArtifactStore, SourceDependency, SourceRecord } from "@/types/learning-constitution";

const at = "2026-09-03T14:00:00.000Z";
const actor = { actorId: "agent:noesis", actorType: "AGENT" as const };
const store = (): SourceCriticismArtifactStore => { const records: SourceCriticismArtifactRecord[] = []; return { append: async (record) => { records.push(record); return record; }, listArtifacts: async (subjectId) => records.filter((record) => record.subjectId === subjectId), listWorkspaceArtifacts: async () => records }; };
const source = (sourceId: string): SourceRecord => ({ sourceId, sourceType: "SECONDARY_ANALYTICAL", title: sourceId, authorOrIssuer: "Publisher", publisher: "Publisher", publicationDate: at, retrievalDate: at, declaredScope: ["PROJECT_A"], provenanceIds: ["P-29"], knownLimitations: ["Derived from upstream reporting."], status: "ACTIVE", registeredBy: actor, registeredAt: at, immutable: true, executionPermissionGranted: false });
const assessment = (sourceId: string): SourceAssessment => ({ assessmentId: `A:${sourceId}`, sourceId, claimId: "CLAIM-29", authority: "REPUTABLE_SECONDARY", authorityRationale: "The source is a secondary analysis, not an independent original record.", directness: "SECONDARY", volatility: "MODERATE", recencyAppropriate: true, relevance: "DIRECTLY_RELEVANT", scopeMatch: "EXACT", corroboration: "DEPENDENT_DIRECT", conflictIds: [], strength: "WEAK", limitations: ["Shared origin"], assessedBy: actor, assessedAt: at, supersedesAssessmentId: null, immutable: true });
const link = (sourceId: string): ClaimEvidenceLink => ({ linkId: `L:${sourceId}`, claimId: "CLAIM-29", sourceId, relation: "SUPPORTS", relevance: "DIRECTLY_RELEVANT", directness: "SECONDARY", scopeMatch: "EXACT", interpretation: "Supports the narrow claim only.", evidenceIds: ["E-29"], createdAt: at, createdBy: actor, immutable: true });
const dependency = (downstreamSourceId: string): SourceDependency => ({ dependencyId: `D:${downstreamSourceId}`, downstreamSourceId, upstreamSourceId: "ROOT-29", kind: "SAME_ORIGIN", evidence: ["shared citation"], discoveredAt: at, discoveredBy: actor, immutable: true });

describe("Phase 29 integrated acceptance", () => {
  it("turns a citation avalanche into one weak lineage, preserves the audit trail, and never creates authority or durable knowledge", async () => {
    const artifacts = store(); const registry = new SourceRegistryService(artifacts); const sources = ["BLOG-1", "BLOG-2", "BLOG-3"];
    await Promise.all(sources.map((sourceId) => registry.register(source(sourceId))));
    await Promise.all(sources.map((sourceId) => registry.link(link(sourceId))));
    await Promise.all(sources.map((sourceId) => registry.addDependency(dependency(sourceId))));
    const decision = new SourceCriticismEngine().assess({ claimId: "CLAIM-29", assessments: sources.map(assessment), links: sources.map(link), dependencies: sources.map(dependency), burden: "NORMAL" });
    expect(decision).toMatchObject({ status: "INSUFFICIENT_EVIDENCE", independentOriginIds: ["ROOT-29"], majorityGuard: { triggered: true, publicationCount: 3, independentOriginCount: 1 } });
    const assessments = new SourceAssessmentService(artifacts); await assessments.record(assessment("BLOG-1"));
    await assessments.cluster({ clusterId: "CLUSTER-29", claimId: decision.claimId, supportingSourceIds: decision.supportingSourceIds, contradictingSourceIds: decision.contradictingSourceIds, independentOriginIds: decision.independentOriginIds, assessment: decision.status, strength: decision.strength, conflictClassification: null, limitations: ["Citation propagation"], rationale: decision.rationale, createdAt: at, createdBy: actor, immutable: true, durableKnowledgeEffect: "NONE", executionPermissionGranted: false });
    expect(new SourceCriticismGateAdvisor().advise(decision)).toMatchObject({ disposition: "DEFER", reason: "SOURCE_INSUFFICIENT" });
    const audit = new InMemoryLearningAuditLedger(); await new SourceCriticismAuditService(audit).record({ eventId: "AUDIT-29", eventType: "FALSE_CORROBORATION_DETECTED", workspaceId: "workspace:29", occurredAt: at, actor, correlationId: "phase29", claimId: decision.claimId, sourceIds: sources, payload: { independentOrigins: decision.independentOriginIds.length } });
    expect((await audit.list("workspace:29")).map((entry) => entry.event.eventType)).toContain("FALSE_CORROBORATION_DETECTED");
    expect((await artifacts.listWorkspaceArtifacts()).map((artifact) => artifact.artifactType)).toEqual(expect.arrayContaining(["SOURCE", "CLAIM_EVIDENCE", "DEPENDENCY", "ASSESSMENT", "CLUSTER"]));
  });
});
