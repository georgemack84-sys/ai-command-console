import { describe, expect, it } from "vitest";
import { CausalInferenceGuard, EpistemicSynthesisAuditService, EpistemicSynthesisEngine, EpistemicSynthesisGateAdvisor, EpistemicSynthesisRegistryService, InMemoryLearningAuditLedger, createSynthesisInputHash } from "@/services/learning-constitution";
import type { EpistemicProposition, EpistemicSynthesisArtifactRecord, EpistemicSynthesisArtifactStore, EvidenceCluster, SynthesisSnapshot } from "@/types/learning-constitution";

const at = "2026-09-03T16:00:00.000Z";
const actor = { actorId: "agent:noesis", actorType: "AGENT" as const };
const store = (): EpistemicSynthesisArtifactStore => { const records: EpistemicSynthesisArtifactRecord[] = []; return { append: async (record) => { records.push(record); return record; }, listArtifacts: async (subjectId) => records.filter((record) => record.subjectId === subjectId), listWorkspaceArtifacts: async () => records }; };
const cluster = (clusterId: string, assessment: EvidenceCluster["assessment"], strength: EvidenceCluster["strength"]): EvidenceCluster => ({ clusterId, claimId: "EP-EXIT", supportingSourceIds: [clusterId], contradictingSourceIds: [], independentOriginIds: [clusterId], assessment, strength, conflictClassification: assessment === "CONFLICTING" ? "GENUINE_CONFLICT" : null, limitations: [], rationale: "Source-criticism cluster.", createdAt: at, createdBy: actor, immutable: true, durableKnowledgeEffect: "NONE", executionPermissionGranted: false });

describe("Phase 30 integrated acceptance", () => {
  it("forms a revisable scoped belief from clusters, resists weak conflict, preserves audit, and never manufactures authority", async () => {
    const artifacts = store(); const proposition: EpistemicProposition = { propositionId: "EP-EXIT", normalizedKey: "feature-x:auth:project-a", statement: "Feature X requires authentication in Project A.", polarity: "AFFIRM", scope: ["PROJECT_A", "CURRENT"], validFrom: "2026-01-01T00:00:00.000Z", validTo: null, createdBy: actor, createdAt: at, immutable: true, durableKnowledgeEffect: "NONE", executionPermissionGranted: false };
    const draft = { snapshotId: "SNAP-EXIT", propositionId: proposition.propositionId, asOf: at, evidenceClusterIds: ["EC-PRIMARY", "EC-DERIVATIVE"], sourceAssessmentIds: ["A-PRIMARY"], conflictIds: [], knowledgeGapIds: [], exceptionIds: [], assumptionIds: [], policyVersion: "30.0", createdAt: at, immutable: true };
    const snapshot: SynthesisSnapshot = { ...draft, inputHash: createSynthesisInputHash(draft) };
    const registry = new EpistemicSynthesisRegistryService(artifacts); await registry.registerProposition(proposition); await registry.recordSnapshot(snapshot);
    const position = new EpistemicSynthesisEngine().synthesize({ positionId: "POS-EXIT", proposition, snapshot, clusters: [cluster("EC-PRIMARY", "SUPPORTED", "VERY_STRONG"), cluster("EC-DERIVATIVE", "CONFLICTING", "WEAK")], assumptions: [], assessedBy: actor, assessedAt: at });
    expect(position).toMatchObject({ status: "STRONGLY_SUPPORTED", durableStatus: "NOT_SUBMITTED", authorityEffect: "UNCHANGED", executionPermissionGranted: false }); await registry.recordPosition(position);
    expect(new EpistemicSynthesisGateAdvisor().advise(position)).toMatchObject({ disposition: "ALLOW", reason: "EPISTEMIC_POSITION_SUFFICIENT" });
    expect(new CausalInferenceGuard().evaluate({ proposition: "The feature caused improved reliability.", directCausalEvidence: false, confoundersResolved: false, unresolvedAlternatives: ["Traffic mix changed"] })).toMatchObject({ allowed: false, disposition: "REQUEST_MORE_EVIDENCE" });
    const audit = new InMemoryLearningAuditLedger(); await new EpistemicSynthesisAuditService(audit).record({ eventId: "AUDIT-EXIT", eventType: "BELIEF_SUPPORTED", workspaceId: "workspace:30", occurredAt: at, actor, correlationId: "phase30", propositionId: proposition.propositionId, positionId: position.positionId, payload: { status: position.status } });
    expect((await audit.list("workspace:30")).map((entry) => entry.event.eventType)).toContain("BELIEF_SUPPORTED"); expect((await artifacts.listWorkspaceArtifacts()).map((artifact) => artifact.artifactType)).toEqual(expect.arrayContaining(["PROPOSITION", "SNAPSHOT", "POSITION"]));
  });
});
