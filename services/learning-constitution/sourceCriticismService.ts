import type { ClaimEvidenceLink, ClaimGranularityDecision, EvidenceBurden, EvidenceCluster, EvidenceStatus, EvidenceStrength, SourceAssessment, SourceCriticismArtifactStore, SourceCriticismDecision, SourceCriticismRequest, SourceDependency, SourceRecord } from "../../types/learning-constitution/sourceCriticism";
import type { SourceCriticismAuditType } from "../../types/learning-constitution/sourceCriticism";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { ProvenanceActor } from "../../types/learning-constitution/provenance";

/** Stores source facts separately from claim-relative judgments; no source may become durable knowledge here. */
export class SourceRegistryService {
  constructor(private readonly artifacts: SourceCriticismArtifactStore) {}
  async register(source: SourceRecord) { if (!source.sourceId.trim() || !source.title.trim() || !source.retrievalDate || !source.immutable || source.executionPermissionGranted) throw new Error("source records must be identified, immutable facts without execution authority"); await this.artifacts.append({ artifactId: `SOURCE:${source.sourceId}`, artifactType: "SOURCE", subjectId: source.sourceId, payload: source, createdAt: source.registeredAt }); return source; }
  async link(link: ClaimEvidenceLink) { if (!link.claimId.trim() || !link.sourceId.trim() || !link.interpretation.trim() || !link.immutable) throw new Error("claim evidence links require a specific immutable claim interpretation"); await this.artifacts.append({ artifactId: `SOURCE_CLAIM_LINK:${link.linkId}`, artifactType: "CLAIM_EVIDENCE", subjectId: link.claimId, payload: link, createdAt: link.createdAt }); return link; }
  async addDependency(dependency: SourceDependency) { if (!dependency.downstreamSourceId.trim() || !dependency.upstreamSourceId.trim() || dependency.downstreamSourceId === dependency.upstreamSourceId || !dependency.immutable) throw new Error("source dependencies must be immutable edges between distinct sources"); await this.artifacts.append({ artifactId: `SOURCE_DEPENDENCY:${dependency.dependencyId}`, artifactType: "DEPENDENCY", subjectId: dependency.downstreamSourceId, payload: dependency, createdAt: dependency.discoveredAt }); return dependency; }
}

export class SourceAssessmentService {
  constructor(private readonly artifacts: SourceCriticismArtifactStore) {}
  async record(assessment: SourceAssessment) { if (!assessment.sourceId.trim() || !assessment.claimId.trim() || !assessment.authorityRationale.trim() || !assessment.immutable) throw new Error("source assessments must be claim-relative, explained, and immutable"); await this.artifacts.append({ artifactId: `SOURCE_ASSESSMENT:${assessment.assessmentId}`, artifactType: "ASSESSMENT", subjectId: assessment.claimId, payload: assessment, createdAt: assessment.assessedAt }); return assessment; }
  async cluster(cluster: EvidenceCluster) { if (!cluster.claimId.trim() || !cluster.rationale.trim() || !cluster.immutable || cluster.durableKnowledgeEffect !== "NONE" || cluster.executionPermissionGranted) throw new Error("evidence clusters cannot grant execution or directly alter durable knowledge"); await this.artifacts.append({ artifactId: `EVIDENCE_CLUSTER:${cluster.clusterId}`, artifactType: "CLUSTER", subjectId: cluster.claimId, payload: cluster, createdAt: cluster.createdAt }); return cluster; }
}

const strengthRank: Record<EvidenceStrength, number> = { INSUFFICIENT: 0, VERY_WEAK: 1, WEAK: 2, MODERATE: 3, STRONG: 4, VERY_STRONG: 5 };
const strongest = (assessments: readonly SourceAssessment[]): EvidenceStrength => assessments.reduce<EvidenceStrength>((best, assessment) => strengthRank[assessment.strength] > strengthRank[best] ? assessment.strength : best, "INSUFFICIENT");
const sufficientFor = (strength: EvidenceStrength, burden: EvidenceBurden, independentOrigins: number) => strengthRank[strength] >= ({ LOW: 3, NORMAL: 3, HIGH: 4, CRITICAL: independentOrigins >= 2 ? 4 : 5 } satisfies Record<EvidenceBurden, number>)[burden];

/** Deterministic, count-resistant claim assessment. Its output is evidence metadata, never an authority or a knowledge write. */
export class SourceCriticismEngine {
  assess(request: SourceCriticismRequest): SourceCriticismDecision {
    const assessments = request.assessments.filter((assessment) => assessment.claimId === request.claimId);
    const linkBySource = new Map(request.links.filter((link) => link.claimId === request.claimId).map((link) => [link.sourceId, link]));
    const graph = new Map<string, string[]>();
    for (const edge of request.dependencies) graph.set(edge.downstreamSourceId, [...(graph.get(edge.downstreamSourceId) ?? []), edge.upstreamSourceId]);
    const circular = new Set<string>();
    const rootsFor = (sourceId: string, visiting = new Set<string>()): string[] => {
      if (visiting.has(sourceId)) { for (const id of visiting) circular.add(id); return []; }
      const upstream = graph.get(sourceId) ?? [];
      if (!upstream.length) return [sourceId];
      const next = new Set(visiting).add(sourceId);
      return upstream.flatMap((id) => rootsFor(id, next));
    };
    const supporting = assessments.filter((assessment) => { const relation = linkBySource.get(assessment.sourceId)?.relation; return (relation === "SUPPORTS" || relation === "PARTIALLY_SUPPORTS") && assessment.scopeMatch !== "OUT_OF_SCOPE" && assessment.recencyAppropriate; });
    const contradicting = assessments.filter((assessment) => linkBySource.get(assessment.sourceId)?.relation === "CONTRADICTS" && assessment.scopeMatch !== "OUT_OF_SCOPE" && assessment.recencyAppropriate);
    const excludedOutOfScopeSourceIds = assessments.filter((assessment) => assessment.scopeMatch === "OUT_OF_SCOPE").map((assessment) => assessment.sourceId);
    const excludedStaleSourceIds = assessments.filter((assessment) => !assessment.recencyAppropriate).map((assessment) => assessment.sourceId);
    const supportingSourceIds = supporting.map((assessment) => assessment.sourceId);
    const contradictingSourceIds = contradicting.map((assessment) => assessment.sourceId);
    const independentOriginIds = [...new Set(supportingSourceIds.flatMap((sourceId) => rootsFor(sourceId)).filter((id) => !circular.has(id)))];
    const supportStrength = strongest(supporting.filter((assessment) => !circular.has(assessment.sourceId)));
    const contradictionStrength = strongest(contradicting.filter((assessment) => !circular.has(assessment.sourceId)));
    const majorityGuard = { triggered: supportingSourceIds.length > independentOriginIds.length && supportingSourceIds.length > 1, publicationCount: supportingSourceIds.length, independentOriginCount: independentOriginIds.length, reason: supportingSourceIds.length > independentOriginIds.length ? "Publication count is reduced to independent evidence origins." : "No citation-count imbalance detected." } as const;
    const hasMeaningfulConflict = contradicting.length > 0 && strengthRank[contradictionStrength] >= strengthRank[supportStrength] && strengthRank[contradictionStrength] >= 3;
    const sufficient = sufficientFor(supportStrength, request.burden, independentOriginIds.length);
    const status: EvidenceStatus = hasMeaningfulConflict ? "CONFLICTING" : !supporting.length || !sufficient ? "INSUFFICIENT_EVIDENCE" : independentOriginIds.length > 1 ? "SUPPORTED" : "PROVISIONALLY_SUPPORTED";
    const recommendedAction = status === "CONFLICTING" ? "INVOKE_CONFLICT_ENGINE" : status === "INSUFFICIENT_EVIDENCE" ? "REQUEST_MORE_EVIDENCE" : "PROCEED";
    return { claimId: request.claimId, status, strength: supportStrength, supportingSourceIds, contradictingSourceIds, independentOriginIds, circularSourceIds: [...circular], excludedOutOfScopeSourceIds, excludedStaleSourceIds, majorityGuard, recommendedAction, rationale: status === "CONFLICTING" ? "Competing evidence structures contain a contradiction at least as strong as the supporting structure." : status === "INSUFFICIENT_EVIDENCE" ? "Support does not meet the required evidence burden after recency, scope, dependency, and circular-lineage checks." : `Assessment uses ${independentOriginIds.length} independent origin(s), not ${supportingSourceIds.length} supporting publication(s).` };
  }
}

/** Bridges significant source-criticism facts into Phase 10 without creating authority or a durable knowledge write. */
export class SourceCriticismAuditService {
  constructor(private readonly ledger: LearningAuditLedger) {}
  async record(input: Readonly<{ eventId: string; eventType: SourceCriticismAuditType; workspaceId: string; occurredAt: string; actor: ProvenanceActor; correlationId: string; claimId?: string; sourceIds?: readonly string[]; payload: Readonly<Record<string, unknown>> }>) {
    return this.ledger.append({ eventId: input.eventId, eventType: input.eventType, workspaceId: input.workspaceId, occurredAt: input.occurredAt, actor: input.actor, correlationId: input.correlationId, schemaVersion: "10.0", references: { provenanceIds: input.sourceIds }, payload: { ...input.payload, claimId: input.claimId ?? null, sourceIds: input.sourceIds ?? [], evidenceOnly: true, executionPermissionGranted: false } });
  }
}

/** Small adapter for callers that need an explicit Phase 9-ready disposition without manufacturing knowledge authority. */
export class SourceCriticismGateAdvisor {
  advise(decision: SourceCriticismDecision): Readonly<{ disposition: "ALLOW" | "DEFER" | "REJECT"; reason: "SOURCE_SUFFICIENT" | "SOURCE_INSUFFICIENT" | "SOURCE_CONFLICT_UNRESOLVED" | "SOURCE_OUT_OF_SCOPE" }> {
    if (decision.excludedOutOfScopeSourceIds.length) return { disposition: "DEFER", reason: "SOURCE_OUT_OF_SCOPE" };
    if (decision.status === "CONFLICTING" || decision.status === "UNRESOLVED") return { disposition: "DEFER", reason: "SOURCE_CONFLICT_UNRESOLVED" };
    if (decision.status === "SUPPORTED") return { disposition: "ALLOW", reason: "SOURCE_SUFFICIENT" };
    return { disposition: decision.status === "REFUTED" || decision.status === "UNSUPPORTED" ? "REJECT" : "DEFER", reason: "SOURCE_INSUFFICIENT" };
  }
}

/** Prevents a narrow observation from being turned into a broader rule or causal conclusion. */
export class ClaimGranularityGuard {
  evaluate(input: Readonly<{ observedScope: readonly string[]; proposedScope: readonly string[]; unsupportedExpansion: readonly string[]; causalStepsBeyondObservation: number }>): ClaimGranularityDecision {
    const unsupported = [...new Set([...input.unsupportedExpansion, ...input.proposedScope.filter((scope) => !input.observedScope.includes(scope))])];
    if (unsupported.length) return { allowed: false, disposition: "NARROW_SCOPE", reason: "The proposed claim exceeds the scope established by its evidence.", unsupportedExpansion: unsupported };
    if (input.causalStepsBeyondObservation > 0) return { allowed: false, disposition: "REQUEST_MORE_EVIDENCE", reason: "The proposed causal conclusion requires evidence beyond the observed result.", unsupportedExpansion: [] };
    return { allowed: true, disposition: "EXACT", reason: "The proposed claim remains within the observed evidence scope.", unsupportedExpansion: [] };
  }
}
