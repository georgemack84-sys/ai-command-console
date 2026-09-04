import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const getSessionUserMock = vi.hoisted(() => vi.fn());
const requireWorkspaceManagerMock = vi.hoisted(() => vi.fn());
const analyzeMock = vi.hoisted(() => vi.fn());
const recordProfileMock = vi.hoisted(() => vi.fn());
const recordSelectionMock = vi.hoisted(() => vi.fn());
const recordBridgeMock = vi.hoisted(() => vi.fn());
const registryConstructorMock = vi.hoisted(() => vi.fn());
const auditConstructorMock = vi.hoisted(() => vi.fn());
const registryArtifactsMock = vi.hoisted(() => vi.fn());
const evaluationArtifactsMock = vi.hoisted(() => vi.fn());
const engineSelectMock = vi.hoisted(() => vi.fn());
const bridgeApproveMock = vi.hoisted(() => vi.fn());

vi.mock("@/src/lib/auth", () => ({ getSessionUser: getSessionUserMock }));
vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceManager: requireWorkspaceManagerMock }));
const serviceModule = () => ({
  ObjectiveProfileService: class { analyze = analyzeMock; riskTier(risk: string) { return risk === "SECURITY_CRITICAL" ? "HIGH" : risk; } defaultContext() { return "REASONING"; } },
  PrismaStrategyRegistryRepository: class { constructor(...args: unknown[]) { registryConstructorMock(...args); } listWorkspaceArtifacts = registryArtifactsMock; },
  PrismaStrategyEvaluationRepository: class { listWorkspaceArtifacts = evaluationArtifactsMock; },
  PrismaSelfDirectedLearningArtifactRepository: class {},
  PrismaLearningAuditLedger: class { constructor(...args: unknown[]) { auditConstructorMock(...args); } },
  StrategySelectionRecordService: class { profile = recordProfileMock; selection = recordSelectionMock; approvalBridge = recordBridgeMock; },
  StrategyEvaluationProfileService: class { profile(input: { strategyId: string }) { return { profileId: `PROFILE-${input.strategyId}`, strategyId: input.strategyId, confidence: "SUPPORTED" }; } },
  StrategySelectionEngineService: class { select = engineSelectMock; },
  StrategyApprovalBridgeService: class { approve = bridgeApproveMock; },
  DEFAULT_STRATEGY_SELECTION_POLICY: { policyVersion: "phase40@1" },
});

let handlers: {
  createProfile: typeof import("@/app/api/learning/strategy-selection/route").POST;
  select: typeof import("@/app/api/learning/strategy-selection/select/route").POST;
  approve: typeof import("@/app/api/learning/strategy-selection/approve-plan/route").POST;
};

beforeAll(async () => {
  vi.doMock("@/services/learning-constitution", serviceModule);
  const [profile, selection, approval] = await Promise.all([
    import("@/app/api/learning/strategy-selection/route"),
    import("@/app/api/learning/strategy-selection/select/route"),
    import("@/app/api/learning/strategy-selection/approve-plan/route"),
  ]);
  handlers = { createProfile: profile.POST, select: selection.POST, approve: approval.POST };
});
const request = (body: unknown) => new Request("http://localhost/api/learning/strategy-selection", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const valid = { objectiveId: "LO-40", domain: "Security", primaryType: "DIAGNOSTIC", typeConfidence: .9, secondaryTypes: ["CONCEPTUAL"], currentMastery: "COMPETENT", targetMastery: "ADVANCED", risk: "HIGH", transferRequirement: "HIGH", retentionRequirement: "HIGH", prerequisites: ["BASE"], knowledgeGapIds: ["GAP"], constraints: ["GOVERNANCE"], classifierVersion: "objective@1" };
describe("Phase 40 objective-profile API workflow", () => {
  beforeEach(() => { vi.clearAllMocks(); getSessionUserMock.mockResolvedValue({ id: "user-1", workspaceId: "workspace-1", role: "MANAGER" }); requireWorkspaceManagerMock.mockResolvedValue(undefined); analyzeMock.mockImplementation((input) => ({ ...input, immutable: true })); recordProfileMock.mockResolvedValue(undefined); recordSelectionMock.mockResolvedValue(undefined); recordBridgeMock.mockResolvedValue(undefined); });
  it("authorizes, validates, and records an immutable profile through the audit-backed workflow", async () => {
    const response = await handlers.createProfile(request(valid)); const payload = await response.json();
    expect(response.status).toBe(201); expect(payload.ok).toBe(true); expect(payload.data.profile).toMatchObject({ objectiveId: "LO-40", immutable: true, classifierVersion: "objective@1" });
    expect(requireWorkspaceManagerMock).toHaveBeenCalledWith({ userId: "user-1", userRole: "MANAGER", workspaceId: "workspace-1" }); expect(registryConstructorMock).toHaveBeenCalledWith("workspace-1"); expect(auditConstructorMock).toHaveBeenCalledWith("workspace-1"); expect(recordProfileMock).toHaveBeenCalledWith(expect.objectContaining({ objectiveId: "LO-40", immutable: true }), "workspace-1", { actorId: "human:user-1", actorType: "HUMAN" }, expect.stringContaining("objective-profile:"));
  });
  it("builds and records an evidence-backed advisory selection without execution authority", async () => {
    const profile = { profileId: "OBJ", objectiveId: "LO-40", domain: "Security", primaryType: "DIAGNOSTIC", typeConfidence: .9, secondaryTypes: [], currentMastery: "COMPETENT", targetMastery: "ADVANCED", risk: "HIGH", transferRequirement: "HIGH", retentionRequirement: "HIGH", prerequisites: [], knowledgeGapIds: [], constraints: [], classifierVersion: "v1", createdAt: "2026-09-05T00:00:00.000Z", immutable: true };
    registryArtifactsMock.mockResolvedValue([{ artifactType: "OBJECTIVE_PROFILE", payload: profile }, { artifactType: "STRATEGY", payload: { strategyId: "S-1", lifecycle: "ACTIVE" } }]); evaluationArtifactsMock.mockResolvedValue([]); engineSelectMock.mockReturnValue({ selectionId: "SEL", status: "RECOMMENDED", selectedStrategyId: "S-1", executionPermissionGranted: false });
    const response = await handlers.select(request({ profileId: "OBJ", learner: { dimensions: { CONCEPTUAL: "KNOWN", APPLICATION: "UNTESTED", GENERALIZATION: "WEAK", BOUNDARY_RECOGNITION: "WEAK", RETENTION: "UNKNOWN", CALIBRATION: "UNKNOWN" }, satisfiedPrerequisites: [], uncertainPrerequisites: [], failedPrerequisites: [], sourceIds: [] }, budget: { timeMinutes: 30, tokenBudget: 1000, teacherAvailability: "LOW" }, difficulty: "HIGH" })); const payload = await response.json();
    expect(response.status).toBe(201); expect(payload.data.selection).toMatchObject({ status: "RECOMMENDED", executionPermissionGranted: false }); expect(engineSelectMock).toHaveBeenCalledWith(expect.objectContaining({ profile, registryVersion: "phase37-registry@1" }), [expect.objectContaining({ strategyId: "S-1" })]); expect(recordSelectionMock).toHaveBeenCalledWith(expect.objectContaining({ selectionId: "SEL", executionPermissionGranted: false }), "workspace-1", { actorId: "human:user-1", actorType: "HUMAN" }, expect.stringContaining("strategy-selection:"));
  });
  it("passes a complete human-approved lineage to the bounded lease bridge", async () => {
    const proposal = { proposalId: "SCP", selectionId: "SEL", objectiveProfileId: "OBJ", status: "AWAITING_HUMAN_APPROVAL" }; const selection = { selectionId: "SEL", objectiveProfileId: "OBJ", selectedStrategyId: "S-1", status: "RECOMMENDED" }; const objective = { profileId: "OBJ", objectiveId: "LO", knowledgeGapIds: ["GAP"] };
    registryArtifactsMock.mockResolvedValue([{ artifactType: "STRATEGY_CURRICULUM_PROPOSAL", payload: proposal }, { artifactType: "PHASE40_SELECTION", payload: selection }, { artifactType: "OBJECTIVE_PROFILE", payload: objective }]); bridgeApproveMock.mockResolvedValue({ bridge: { bridgeId: "BRIDGE", leaseId: "LEASE" }, learningProposal: { proposalId: "LP" }, lease: { leaseId: "LEASE", status: "ACTIVE" } });
    const response = await handlers.approve(request({ curriculumProposalId: "SCP", maximumQuestions: 5, estimatedQuestions: 3, estimatedMinutes: 30, expiresAt: "2026-09-06T00:00:00.000Z", currentState: "UNKNOWN", impact: "HIGH" })); const payload = await response.json();
    expect(response.status).toBe(201); expect(payload.data.lease).toMatchObject({ leaseId: "LEASE", status: "ACTIVE" }); expect(bridgeApproveMock).toHaveBeenCalledWith(expect.objectContaining({ proposal, selection, objective, actor: { actorId: "human:user-1", actorType: "HUMAN" }, maximumQuestions: 5 })); expect(recordBridgeMock).toHaveBeenCalledWith({ bridgeId: "BRIDGE", leaseId: "LEASE" }, "workspace-1", expect.stringContaining("strategy-approval:"));
  });
});
