import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaSkillArtifactRepository, SkillRegistryProjectionService } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

/** Returns a read-only projection. Artifact history remains available for audit and replay. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user?.workspaceId || user.workspaceId === "default") throw new Error("Workspace membership required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const repository = new PrismaSkillArtifactRepository(user.workspaceId);
    const artifacts = await repository.listWorkspaceArtifacts();
    const skillIds = artifacts.filter((artifact) => artifact.artifactType === "CANDIDATE").map((artifact) => artifact.subjectId);
    return apiSuccess({ skills: await new SkillRegistryProjectionService(repository).list(skillIds) });
  } catch (error) { return apiError(error, "Unable to load skills."); }
}
