import { describe, expect, it, vi } from "vitest";
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruAgentRun: { create: vi.fn(), update: vi.fn() } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: vi.fn() } }));
vi.mock("@/src/server/services/nuru-discovery-agent", () => ({ NuruDiscoveryAgent: { discover: vi.fn(async () => ({ runId: "D-114", status: "success", result: { id: "candidate-1", item: { title: "Boundary", content: "Content" }, source: { sourceType: "HUMAN_INPUT", origin: "Owner", authority: "OWNER" }, reasonDiscovered: "Owner submitted candidate.", initialType: "Architecture Decision", relevanceScore: 90, confidence: 0.9, confidenceBand: "VERY_HIGH", status: "CANDIDATE" } })) } }));
vi.mock("@/src/server/services/nuru-context-agent", () => ({ NuruContextAgent: { assess: vi.fn(async () => ({ runId: "C-207", status: "success", result: { candidateId: "candidate-1", itemId: "candidate-1", project: "Nuru", primaryProject: "Nuru", relatedProjects: [], topic: "Boundary", artifactType: "Architecture Decision", scope: "V1", topics: ["Boundary"], sourceContext: "Owner", likelyPurpose: "Set policy.", dependencies: [], relatedComponents: [], confidence: 0.9, confidenceBand: "VERY_HIGH", reasoningSummary: "Source and content support this classification." } })) } }));
vi.mock("@/src/server/services/nuru-connection-agent", () => ({ NuruConnectionAgent: { connect: vi.fn(async () => ({ runId: "CN-88", status: "success", result: { proposals: [] } })) } }));
vi.mock("@/src/server/services/nuru-quality-agent", () => ({ NuruQualityAgent: { assess: vi.fn(async () => ({ runId: "Q-142", status: "success", result: { itemId: "candidate-1", status: "PASS", result: "PASS", issues: [], sourceKnown: true, provenanceAvailable: true, duplicateState: "NOT_DUPLICATE", conflictDetected: false, contextAccurate: true, relationshipsJustified: true, evidenceSufficient: true, confidence: 0.9, confidenceBand: "VERY_HIGH", warnings: [], reasoningSummary: "Evidence is sufficient." } })) } }));
vi.mock("@/src/server/services/nuru-curator-memory-service", () => { const packet = { summary: { project: "Nuru", canonicalPrinciples: 17, projectRules: 2, openConflicts: 2, pendingReviews: 5, recentDecisions: 10, relevantRelationships: 24, policyCount: 4, unavailable: false }, canonicalArchitecture: [], projectRules: [], activeConflicts: [], openReviews: [], recentDecisions: [], relevantRelationships: [], curationPolicies: [] }; return { curatorMemoryPacketSchema: { parse: (value: unknown) => value }, NuruCuratorMemoryService: { build: vi.fn(async () => packet), unavailable: vi.fn(() => packet) } }; });
import { NuruCuratorAgent } from "@/src/server/services/nuru-curator-agent";

describe("Nuru Curator Agent", () => {
  it("uses the fast path for a simple candidate", async () => {
    const result = await NuruCuratorAgent.curate({ title: "A note", content: "A short sourced note about an editorial reading list.", source: { sourceType: "PROJECT_DOCUMENT", origin: "Nuru notes", authority: "MODERATE" }, correlationId: "corr-fast" });
    expect(result).toMatchObject({ status: "success", result: { workflow: "FAST", specialists: ["DISCOVERY", "CONTEXT"], proposal: { requiredReview: true } } });
  });

  it("uses the standard path for governance-significant material", async () => {
    const result = await NuruCuratorAgent.curate({ title: "Governance boundary", content: "This governance policy supersedes an earlier boundary.", source: { sourceType: "HUMAN_INPUT", origin: "Owner", authority: "OWNER" }, correlationId: "corr-standard" });
    expect(result).toMatchObject({ status: "success", result: { workflow: "STANDARD", curatorMemory: { canonicalPrinciples: 17, pendingReviews: 5 }, specialists: ["DISCOVERY", "CONTEXT", "CONNECTION", "QUALITY"], proposal: { recommendation: "ACCEPT", requiredReview: true } } });
  });
});
