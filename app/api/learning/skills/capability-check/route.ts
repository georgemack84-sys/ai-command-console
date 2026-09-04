import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaLearningAuditLedger, PrismaSkillArtifactRepository, SkillCapabilityService, SkillRegistryProjectionService } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

/** A request names a stored skill; callers cannot submit a fabricated capability record. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user?.workspaceId || user.workspaceId === "default") throw new Error("Workspace membership required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { skillId, environmentAvailable = false } = await request.json() as { skillId?: string; environmentAvailable?: boolean };
    if (!skillId?.trim()) throw new Error("skillId is required.");
    const repository = new PrismaSkillArtifactRepository(user.workspaceId);
    const entry = await new SkillRegistryProjectionService(repository).get(skillId);
    if (!entry) throw new Error("Skill was not found.");
    const result = new SkillCapabilityService().check({ skillId: entry.skill.skillId, status: entry.status, evidence: Array.from({ length: entry.activeEvidenceCount }) });
    const occurredAt = new Date().toISOString();
    await new PrismaLearningAuditLedger(user.workspaceId).append({ eventId: `audit:skill-capability:${skillId}:${occurredAt}`, eventType: "SKILL_CAPABILITY_CHECKED", workspaceId: user.workspaceId, occurredAt, actor: { actorId: user.id, actorType: "HUMAN" }, correlationId: `skill-capability:${skillId}:${occurredAt}`, schemaVersion: "10.0", references: {}, payload: { skillId, capability: result.capability, environmentAvailable, authorized: false, currentlyExecutable: false, executionPermissionGranted: false } });
    return apiSuccess({ ...result, environmentAvailable, executionBlockers: environmentAvailable ? ["Explicit execution authorization required."] : ["Required environment or tool unavailable."] });
  } catch (error) { return apiError(error, "Unable to check capability."); }
}
