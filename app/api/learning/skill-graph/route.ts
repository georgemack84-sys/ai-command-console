import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaSkillArtifactRepository, PrismaSkillGraphArtifactRepository, SkillGraphInspectionService, SkillGraphProjectionService, SkillRegistryProjectionService } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

/** Read-only Phase 19 inspection endpoint. Structural changes remain on governed services. */
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user?.workspaceId || user.workspaceId === "default") throw new Error("Workspace membership required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const graphArtifacts = new PrismaSkillGraphArtifactRepository(user.workspaceId);
    const registryArtifacts = new PrismaSkillArtifactRepository(user.workspaceId);
    const [artifacts, registryHistory] = await Promise.all([graphArtifacts.listWorkspaceArtifacts(), registryArtifacts.listWorkspaceArtifacts()]);
    const skillIds = registryHistory.filter((artifact) => artifact.artifactType === "CANDIDATE").map((artifact) => artifact.subjectId);
    const entries = await new SkillRegistryProjectionService(registryArtifacts).list(skillIds);
    const targetSkillId = new URL(request.url).searchParams.get("skillId") ?? undefined;
    return apiSuccess({ inspection: new SkillGraphInspectionService().inspect({ targetSkillId, projection: await new SkillGraphProjectionService(graphArtifacts).get(), registryEntries: new Map(entries.map((entry) => [entry.skill.skillId, entry])), artifacts }) });
  } catch (error) { return apiError(error, "Unable to inspect the skill graph."); }
}
