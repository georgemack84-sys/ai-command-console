import type { EvidenceCluster, EvidenceStrength } from "../../types/learning-constitution/sourceCriticism";
import type { EpistemicAssumption, EpistemicConfidence, EpistemicDebt, EpistemicDependency, EpistemicGuardDecision, EpistemicPosition, EpistemicProposition, EpistemicRevision, EpistemicStatus, EpistemicSynthesisArtifactStore, SynthesisSnapshot } from "../../types/learning-constitution/epistemicSynthesis";
import type { EpistemicSynthesisAuditType } from "../../types/learning-constitution/epistemicSynthesis";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { ProvenanceActor } from "../../types/learning-constitution/provenance";
import type { KnowledgeGapEvidence } from "../../types/learning-constitution/knowledgeGapDetection";

const rank: Record<EvidenceStrength, number> = { INSUFFICIENT: 0, VERY_WEAK: 1, WEAK: 2, MODERATE: 3, STRONG: 4, VERY_STRONG: 5 };
const confidence: Record<EvidenceStrength, EpistemicConfidence> = { INSUFFICIENT: "VERY_LOW", VERY_WEAK: "VERY_LOW", WEAK: "LOW", MODERATE: "MODERATE", STRONG: "HIGH", VERY_STRONG: "VERY_HIGH" };
const canonicalHash = (value: unknown) => { const canonicalize = (item: unknown): unknown => Array.isArray(item) ? item.map(canonicalize) : item && typeof item === "object" ? Object.fromEntries(Object.entries(item as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => [key, canonicalize(nested)])) : item; const text = JSON.stringify(canonicalize(value)); let hash = 2166136261; for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); } return `synthesis-fnv1a:${(hash >>> 0).toString(16)}`; };

export const createSynthesisInputHash = (snapshot: Omit<SynthesisSnapshot, "inputHash">) => canonicalHash({ propositionId: snapshot.propositionId, asOf: snapshot.asOf, evidenceClusterIds: snapshot.evidenceClusterIds, sourceAssessmentIds: snapshot.sourceAssessmentIds, conflictIds: snapshot.conflictIds, knowledgeGapIds: snapshot.knowledgeGapIds, exceptionIds: snapshot.exceptionIds, assumptionIds: snapshot.assumptionIds, policyVersion: snapshot.policyVersion });

/** Append-only proposition registry. It stores positions as claims about current evidence, never as durable knowledge. */
export class EpistemicSynthesisRegistryService {
  constructor(private readonly artifacts: EpistemicSynthesisArtifactStore) {}
  async registerProposition(proposition: EpistemicProposition) { if (!proposition.propositionId.trim() || !proposition.normalizedKey.trim() || !proposition.statement.trim() || !proposition.scope.length || !proposition.immutable || proposition.durableKnowledgeEffect !== "NONE" || proposition.executionPermissionGranted) throw new Error("epistemic propositions must be scoped immutable records without durable or execution effect"); await this.artifacts.append({ artifactId: `EPISTEMIC_PROPOSITION:${proposition.propositionId}`, artifactType: "PROPOSITION", subjectId: proposition.propositionId, payload: proposition, createdAt: proposition.createdAt }); return proposition; }
  async recordSnapshot(snapshot: SynthesisSnapshot) { if (!snapshot.immutable || !snapshot.propositionId.trim() || snapshot.inputHash !== createSynthesisInputHash({ ...snapshot, inputHash: undefined } as unknown as Omit<SynthesisSnapshot, "inputHash">)) throw new Error("synthesis snapshots require an immutable canonical input hash"); await this.artifacts.append({ artifactId: `SYNTHESIS_SNAPSHOT:${snapshot.snapshotId}`, artifactType: "SNAPSHOT", subjectId: snapshot.propositionId, payload: snapshot, createdAt: snapshot.createdAt }); return snapshot; }
  async recordPosition(position: EpistemicPosition) { if (!position.positionId.trim() || !position.propositionId.trim() || !position.snapshotId.trim() || !position.explanation.trim() || !position.immutable || position.authorityEffect !== "UNCHANGED" || position.executionPermissionGranted) throw new Error("epistemic positions require a snapshot and cannot alter authority or execution"); await this.artifacts.append({ artifactId: `EPISTEMIC_POSITION:${position.positionId}`, artifactType: "POSITION", subjectId: position.propositionId, payload: position, createdAt: position.assessedAt }); return position; }
  async registerAssumption(assumption: EpistemicAssumption) { if (!assumption.assumptionId.trim() || !assumption.statement.trim() || !assumption.immutable || assumption.durableKnowledgeEffect !== "NONE" || assumption.executionPermissionGranted) throw new Error("assumptions remain explicit, immutable, and non-durable"); await this.artifacts.append({ artifactId: `EPISTEMIC_ASSUMPTION:${assumption.assumptionId}`, artifactType: "ASSUMPTION", subjectId: assumption.assumptionId, payload: assumption, createdAt: assumption.createdAt }); return assumption; }
  async recordDependency(dependency: EpistemicDependency) { if (!dependency.dependencyId.trim() || !dependency.upstreamPropositionId.trim() || !dependency.downstreamId.trim() || !dependency.immutable) throw new Error("epistemic dependencies must be immutable, explicit links"); await this.artifacts.append({ artifactId: `EPISTEMIC_DEPENDENCY:${dependency.dependencyId}`, artifactType: "DEPENDENCY", subjectId: dependency.upstreamPropositionId, payload: dependency, createdAt: dependency.createdAt }); return dependency; }
  async recordDebt(debt: EpistemicDebt) { if (!debt.debtId.trim() || !debt.propositionId.trim() || !debt.positionId.trim() || !debt.weaknesses.length || !debt.immutable || debt.executionPermissionGranted) throw new Error("epistemic debt must expose a concrete unresolved weakness without execution authority"); await this.artifacts.append({ artifactId: `EPISTEMIC_DEBT:${debt.debtId}`, artifactType: "DEBT", subjectId: debt.propositionId, payload: debt, createdAt: debt.createdAt }); return debt; }
  async recordRevision(revision: EpistemicRevision) { if (!revision.revisionId.trim() || !revision.propositionId.trim() || revision.priorPositionId === revision.nextPositionId || !revision.reassessmentRequired || !revision.immutable || revision.durableKnowledgeEffect !== "NONE" || revision.executionPermissionGranted) throw new Error("belief revisions are immutable reassessment facts, never durable or execution actions"); await this.artifacts.append({ artifactId: `EPISTEMIC_REVISION:${revision.revisionId}`, artifactType: "REVISION", subjectId: revision.propositionId, payload: revision, createdAt: revision.createdAt }); return revision; }
}

/** Compares Phase 29 clusters structurally; publication count never affects a belief position. */
export class EpistemicSynthesisEngine {
  synthesize(input: Readonly<{ positionId: string; proposition: EpistemicProposition; snapshot: SynthesisSnapshot; clusters: readonly EvidenceCluster[]; assumptions: readonly EpistemicAssumption[]; assessedBy: EpistemicPosition["assessedBy"]; assessedAt: string }>): EpistemicPosition {
    if (input.snapshot.propositionId !== input.proposition.propositionId || input.snapshot.asOf !== input.assessedAt || input.snapshot.inputHash !== createSynthesisInputHash({ ...input.snapshot, inputHash: undefined } as unknown as Omit<SynthesisSnapshot, "inputHash">)) throw new Error("epistemic synthesis requires a matching replayable proposition snapshot");
    const scopeValid = input.proposition.validFrom === null || Date.parse(input.assessedAt) >= Date.parse(input.proposition.validFrom); const notExpired = input.proposition.validTo === null || Date.parse(input.assessedAt) <= Date.parse(input.proposition.validTo);
    const clusters = input.clusters.filter((cluster) => input.snapshot.evidenceClusterIds.includes(cluster.clusterId) && cluster.claimId === input.proposition.propositionId);
    const supporting = clusters.filter((cluster) => cluster.assessment === "SUPPORTED" || cluster.assessment === "PROVISIONALLY_SUPPORTED");
    const conflicting = clusters.filter((cluster) => cluster.assessment === "CONFLICTING" || cluster.assessment === "REFUTED");
    const strongestSupport = supporting.reduce<EvidenceCluster | null>((best, cluster) => !best || rank[cluster.strength] > rank[best.strength] ? cluster : best, null);
    const strongestConflict = conflicting.reduce<EvidenceCluster | null>((best, cluster) => !best || rank[cluster.strength] > rank[best.strength] ? cluster : best, null);
    const unresolvedAssumptions = input.assumptions.filter((assumption) => input.snapshot.assumptionIds.includes(assumption.assumptionId) && assumption.status === "UNVERIFIED");
    const conflicted = !!strongestConflict && (!strongestSupport || rank[strongestConflict.strength] >= rank[strongestSupport.strength]);
    const status: EpistemicStatus = !scopeValid || !notExpired ? "SUSPENDED_JUDGMENT" : conflicted ? "SUSPENDED_JUDGMENT" : !strongestSupport ? "INSUFFICIENT_EVIDENCE" : unresolvedAssumptions.length ? "PROVISIONALLY_SUPPORTED" : strongestSupport.strength === "VERY_STRONG" ? "STRONGLY_SUPPORTED" : strongestSupport.strength === "STRONG" ? "SUPPORTED" : "PROVISIONALLY_SUPPORTED";
    const uncertainty = [...(scopeValid && notExpired ? [] : ["The requested as-of time falls outside this proposition's temporal scope."]), ...unresolvedAssumptions.map((assumption) => `Assumption unresolved: ${assumption.statement}`), ...input.snapshot.knowledgeGapIds.map((id) => `Knowledge gap: ${id}`)];
    return { positionId: input.positionId, propositionId: input.proposition.propositionId, snapshotId: input.snapshot.snapshotId, status, confidence: confidence[strongestSupport?.strength ?? "INSUFFICIENT"], supportingClusterIds: supporting.map((cluster) => cluster.clusterId), conflictingClusterIds: conflicting.map((cluster) => cluster.clusterId), strongestSupportingClusterId: strongestSupport?.clusterId ?? null, strongestConflictingClusterId: strongestConflict?.clusterId ?? null, uncertainties: uncertainty, conditions: unresolvedAssumptions.map((assumption) => assumption.statement), whatWouldChange: status === "SUSPENDED_JUDGMENT" ? ["Resolve the strongest conflicting evidence or clarify temporal scope."] : ["Material, in-scope independent contradictory evidence."], explanation: status === "SUSPENDED_JUDGMENT" ? "Judgment is suspended because temporal scope or competing evidence remains unresolved." : status === "INSUFFICIENT_EVIDENCE" ? "No in-scope evidence cluster in this snapshot justifies a belief position." : `Synthesis compares evidence clusters, not citation counts; strongest support is ${strongestSupport?.clusterId}.`, assessedBy: input.assessedBy, assessedAt: input.assessedAt, durableStatus: "NOT_SUBMITTED", authorityEffect: "UNCHANGED", executionPermissionGranted: false, immutable: true };
  }
}

/** Calculates which downstream artifacts need review; it never mutates or re-executes them. */
export class EpistemicDependencyAnalysisService {
  blastRadius(propositionId: string, dependencies: readonly EpistemicDependency[]) { const affected = dependencies.filter((dependency) => dependency.upstreamPropositionId === propositionId); return { propositionId, dependencyIds: affected.map((dependency) => dependency.dependencyId), affected: affected.map((dependency) => ({ id: dependency.downstreamId, kind: dependency.downstreamKind })), reassessmentRequired: affected.length > 0 }; }
}

export class BeliefRevisionService {
  revise(input: Readonly<{ revisionId: string; previous: EpistemicPosition; next: EpistemicPosition; trigger: EpistemicRevision["trigger"]; dependencies: readonly EpistemicDependency[]; createdAt: string; createdBy: EpistemicRevision["createdBy"] }>): EpistemicRevision | null {
    if (input.previous.propositionId !== input.next.propositionId) throw new Error("belief revision requires positions for the same proposition");
    if (input.previous.status === input.next.status && input.previous.snapshotId === input.next.snapshotId) return null;
    const impact = new EpistemicDependencyAnalysisService().blastRadius(input.previous.propositionId, input.dependencies);
    return { revisionId: input.revisionId, propositionId: input.previous.propositionId, priorPositionId: input.previous.positionId, nextPositionId: input.next.positionId, priorStatus: input.previous.status, nextStatus: input.next.status, trigger: input.trigger, affectedDependencyIds: impact.dependencyIds, reassessmentRequired: true, createdAt: input.createdAt, createdBy: input.createdBy, immutable: true, durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
  }
}

/** Appends Phase 30 transitions to the canonical audit ledger; evidence evaluation cannot manufacture authority. */
export class EpistemicSynthesisAuditService {
  constructor(private readonly ledger: LearningAuditLedger) {}
  async record(input: Readonly<{ eventId: string; eventType: EpistemicSynthesisAuditType; workspaceId: string; occurredAt: string; actor: ProvenanceActor; correlationId: string; propositionId: string; positionId?: string; payload: Readonly<Record<string, unknown>> }>) { return this.ledger.append({ eventId: input.eventId, eventType: input.eventType, workspaceId: input.workspaceId, occurredAt: input.occurredAt, actor: input.actor, correlationId: input.correlationId, schemaVersion: "10.0", references: {}, payload: { ...input.payload, propositionId: input.propositionId, positionId: input.positionId ?? null, authorityEffect: "UNCHANGED", durableKnowledgeEffect: "NONE", executionPermissionGranted: false } }); }
}

/** Exposes weak, conflicted, or suspended epistemic positions to Phase 25 without resolving a gap or launching retrieval. */
export class EpistemicSynthesisKnowledgeGapIntegrationService {
  toEvidence(input: Readonly<{ evidenceId: string; dimension: string; position: EpistemicPosition }>): KnowledgeGapEvidence { const established = input.position.status === "SUPPORTED" || input.position.status === "STRONGLY_SUPPORTED"; return { evidenceId: input.evidenceId, dimension: input.dimension, established, conflicting: input.position.status === "CONFLICTING" || input.position.status === "SUSPENDED_JUDGMENT" || input.position.status === "UNRESOLVED", interpretationCertain: established && !input.position.conditions.length, validatedInScope: !input.position.uncertainties.some((item) => item.toLowerCase().includes("scope")), sourceId: `epistemic-synthesis:${input.position.positionId}`, summary: input.position.explanation }; }
}

export class EpistemicSynthesisGateAdvisor {
  advise(position: EpistemicPosition): Readonly<{ disposition: "ALLOW" | "DEFER" | "REJECT"; reason: "EPISTEMIC_POSITION_SUFFICIENT" | "EPISTEMIC_POSITION_INSUFFICIENT" | "EPISTEMIC_POSITION_SUSPENDED" | "EPISTEMIC_POSITION_REFUTED" }> { if (position.status === "SUPPORTED" || position.status === "STRONGLY_SUPPORTED") return { disposition: "ALLOW", reason: "EPISTEMIC_POSITION_SUFFICIENT" }; if (position.status === "REFUTED" || position.status === "REJECTED") return { disposition: "REJECT", reason: "EPISTEMIC_POSITION_REFUTED" }; if (position.status === "SUSPENDED_JUDGMENT" || position.status === "CONFLICTING" || position.status === "UNRESOLVED") return { disposition: "DEFER", reason: "EPISTEMIC_POSITION_SUSPENDED" }; return { disposition: "DEFER", reason: "EPISTEMIC_POSITION_INSUFFICIENT" }; }
}

/** Correlation is insufficient for a causal belief while plausible alternatives remain unresolved. */
export class CausalInferenceGuard {
  evaluate(input: Readonly<{ proposition: string; directCausalEvidence: boolean; unresolvedAlternatives: readonly string[]; confoundersResolved: boolean }>): EpistemicGuardDecision {
    const causalLanguage = /\b(caused|because|resulted in|led to|improved|reduced|increased|prevented)\b/i.test(input.proposition);
    if (!causalLanguage) return { allowed: true, disposition: "ALLOW", reason: "The proposition does not assert causation.", unresolvedAlternatives: [] };
    if (!input.directCausalEvidence || !input.confoundersResolved) return { allowed: false, disposition: "REQUEST_MORE_EVIDENCE", reason: "A causal conclusion requires direct causal evidence and resolved confounders.", unresolvedAlternatives: input.unresolvedAlternatives };
    if (input.unresolvedAlternatives.length) return { allowed: false, disposition: "SUSPEND", reason: "Plausible alternative explanations remain unresolved.", unresolvedAlternatives: input.unresolvedAlternatives };
    return { allowed: true, disposition: "ALLOW", reason: "Causal evidence and alternative-explanation checks are satisfied.", unresolvedAlternatives: [] };
  }
}

export class AlternativeExplanationGuard {
  evaluate(alternatives: readonly string[], distinguishedByEvidence: boolean): EpistemicGuardDecision { if (!alternatives.length) return { allowed: true, disposition: "ALLOW", reason: "No plausible alternative explanation has been identified.", unresolvedAlternatives: [] }; return distinguishedByEvidence ? { allowed: true, disposition: "ALLOW", reason: "Available evidence distinguishes the identified alternatives.", unresolvedAlternatives: [] } : { allowed: false, disposition: "SUSPEND", reason: "Evidence does not distinguish plausible alternative explanations.", unresolvedAlternatives: alternatives }; }
}
