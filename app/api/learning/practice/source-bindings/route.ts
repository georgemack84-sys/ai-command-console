import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaLearningAuditLedger, PrismaPracticeArtifactRepository, PrismaPracticeSourceAuthorityVerifier, PrismaSkillArtifactRepository, PracticeSourceBindingService } from "@/services/learning-constitution";
import type { PracticeSourceBinding, PracticeSourceKind } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";
const sourceKinds = new Set<PracticeSourceKind>(["KNOWLEDGE", "PROCEDURE", "PRINCIPLE", "EXAMPLE"]);
const userFor = async () => { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "Workspace membership is required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; };

export async function GET(request: Request) {
  try {
    const user = await userFor(); const skillId = new URL(request.url).searchParams.get("skillId")?.trim();
    if (!skillId) throw new AppError(400, "skill_required", "skillId is required.");
    const bindings = (await new PrismaPracticeArtifactRepository(user.workspaceId!).listArtifacts(skillId)).filter((artifact) => artifact.artifactType === "LINEAGE_BINDING").map((artifact) => artifact.payload as PracticeSourceBinding);
    return apiSuccess({ bindings });
  } catch (error) { return apiError(error, "Unable to load practice source bindings."); }
}

export async function POST(request: Request) {
  try {
    const user = await userFor(); const input = await request.json() as Partial<PracticeSourceBinding>;
    if (!input || typeof input !== "object" || !input.skillId?.trim() || !input.sourceId?.trim() || !input.sourceSnapshotId?.trim() || !input.provenanceId?.trim() || !input.sourceKind || !sourceKinds.has(input.sourceKind)) throw new AppError(400, "practice_source_binding_invalid", "A skill, approved source kind and ID, snapshot, and provenance are required.");
    const now = new Date().toISOString();
    const binding: PracticeSourceBinding = { bindingId: input.bindingId?.trim() || crypto.randomUUID(), skillId: input.skillId.trim(), sourceKind: input.sourceKind, sourceId: input.sourceId.trim(), sourceSnapshotId: input.sourceSnapshotId.trim(), provenanceId: input.provenanceId.trim(), status: "ACTIVE", boundBy: { actorId: `user:${user.id}`, actorType: "HUMAN" }, boundAt: now };
    const service = new PracticeSourceBindingService(new PrismaPracticeArtifactRepository(user.workspaceId!), new PrismaSkillArtifactRepository(user.workspaceId!), new PrismaPracticeSourceAuthorityVerifier(user.workspaceId!), new PrismaLearningAuditLedger(user.workspaceId!));
    return apiSuccess({ binding: await service.bind(binding, user.workspaceId!, `practice-source-binding:${binding.bindingId}`) }, { status: 201 });
  } catch (error) { return apiError(error, "Unable to bind practice source."); }
}
