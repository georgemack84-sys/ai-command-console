import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/src/server/db/prisma";
import { PrismaLearningAuditLedger, PrismaSelfDirectedLearningArtifactRepository, PrismaStrategyRegistryRepository, StrategyApprovalBridgeService, StrategyCurriculumProposalService, StrategySelectionRecordService } from "@/services/learning-constitution";
import type { LearningObjectiveProfile, StrategySelectionRecord } from "@/types/learning-constitution";

const enabled = process.env.NOESIS_RUN_DATABASE_INTEGRATION === "true";
const runId = crypto.randomUUID();
const workspaceId = `phase40-integration-${crypto.randomUUID()}`;
const workspaceSlug = `phase40-integration-${crypto.randomUUID()}`;
const at = new Date().toISOString();
const actor = { actorId: "human:phase40-integration", actorType: "HUMAN" as const };

/**
 * Opt-in database integration coverage. It is deliberately disabled unless a
 * dedicated test database is configured and explicitly enabled.
 */
describe.runIf(enabled)("Phase 40 database workflow", () => {
  beforeAll(async () => {
    await prisma.workspace.create({ data: { id: workspaceId, name: "Phase 40 integration", slug: workspaceSlug, description: "Isolated database integration fixture." } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists the immutable profile-to-approval lineage and its bounded lease", async () => {
    const objective: LearningObjectiveProfile = {
      profileId: `OBJ-DB-${runId}`, objectiveId: `LO-DB-${runId}`, domain: "Security", primaryType: "DIAGNOSTIC", typeConfidence: 0.9,
      secondaryTypes: ["CONCEPTUAL"], currentMastery: "COMPETENT", targetMastery: "ADVANCED", risk: "HIGH",
      transferRequirement: "HIGH", retentionRequirement: "HIGH", prerequisites: ["BASE"], knowledgeGapIds: ["GAP-DB"],
      constraints: ["GOVERNANCE"], classifierVersion: "database-integration@1", createdAt: at, immutable: true,
    };
    const selection = {
      selectionId: `SEL-DB-${runId}`, requestId: `REQ-DB-${runId}`, objectiveProfileId: objective.profileId, objectiveId: objective.objectiveId,
      selectedStrategyId: "TARGETED-REVIEW", status: "RECOMMENDED", policyVersion: "phase40@1", classifierVersion: objective.classifierVersion,
      evidenceSnapshotId: "phase39-db", mode: "EXPLOIT", rationale: ["Persisted integration evidence."], scores: [],
      eligibleStrategyIds: ["TARGETED-REVIEW"], excludedStrategyIds: [], createdAt: at, immutable: true,
      executionPermissionGranted: false, authorityEffect: "UNCHANGED",
    } as unknown as StrategySelectionRecord;
    const registry = new PrismaStrategyRegistryRepository(workspaceId);
    const audit = new PrismaLearningAuditLedger(workspaceId);
    const records = new StrategySelectionRecordService(registry, audit);

    await records.profile(objective, workspaceId, actor, "db-profile");
    await records.selection(selection, workspaceId, actor, "db-selection");
    const proposal = new StrategyCurriculumProposalService().propose({ proposalId: `SCP-DB-${runId}`, selection, objective, goal: "Diagnose authentication failures", createdAt: at });
    await records.curriculumProposal(proposal, workspaceId, actor, "db-proposal");

    const approval = await new StrategyApprovalBridgeService(new PrismaSelfDirectedLearningArtifactRepository(workspaceId), audit).approve({
      bridgeId: `BRIDGE-DB-${runId}`, proposal, selection, objective, actor, maximumQuestions: 5, estimatedQuestions: 3, estimatedMinutes: 30,
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(), currentState: "UNKNOWN", impact: "HIGH", createdAt: at,
      workspaceId, correlationId: "db-approval",
    });
    await records.approvalBridge(approval.bridge, workspaceId, "db-bridge");

    const artifacts = await registry.listWorkspaceArtifacts();
    expect(artifacts.map((item) => item.artifactType)).toEqual(expect.arrayContaining([
      "OBJECTIVE_PROFILE", "PHASE40_SELECTION", "STRATEGY_CURRICULUM_PROPOSAL", "STRATEGY_APPROVAL_BRIDGE",
    ]));
    expect(artifacts.find((item) => item.artifactType === "STRATEGY_APPROVAL_BRIDGE")?.payload).toMatchObject({
      curriculumProposalId: proposal.proposalId, selectionId: selection.selectionId, leaseId: approval.lease.leaseId,
    });

    const learningArtifacts = await new PrismaSelfDirectedLearningArtifactRepository(workspaceId).listArtifacts(approval.learningProposal.proposalId);
    expect(learningArtifacts.map((item) => item.artifactType)).toEqual(expect.arrayContaining(["PROPOSAL", "APPROVAL", "LEASE"]));
    expect(approval.lease).toMatchObject({ status: "ACTIVE", maximumQuestions: 5, issuedBy: actor });

    const auditEntries = await audit.list(workspaceId);
    expect(auditEntries.map((entry) => entry.event.eventType)).toEqual(expect.arrayContaining([
      "LEARNING_OBJECTIVE_DEFINED", "STRATEGY_RECOMMENDED", "LEARNING_PROPOSAL_CREATED", "LEARNING_PROPOSAL_APPROVED",
    ]));
    const phase40RecordEntries = auditEntries.filter((entry) => typeof entry.event.payload === "object" && entry.event.payload !== null && "artifactId" in entry.event.payload);
    expect(phase40RecordEntries.every((entry) => (entry.event.payload as { executionPermissionGranted?: boolean }).executionPermissionGranted === false)).toBe(true);
  });
});

describe.skipIf(enabled)("Phase 40 database workflow", () => {
  it("requires an explicit dedicated test-database opt-in", () => {
    expect(process.env.NOESIS_RUN_DATABASE_INTEGRATION).not.toBe("true");
  });
});
