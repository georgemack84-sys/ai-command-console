import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { prisma } from "@/src/server/db/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

    const applications = await prisma.registeredApplication.findMany({
      where: { workspaceId: user.workspaceId, slug: { in: ["nuru", "headline-flow"] } },
      orderBy: { slug: "asc" },
      include: {
        servicePrincipals: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "asc" },
          include: { credentials: { where: { status: "ACTIVE" }, orderBy: { issuedAt: "desc" }, take: 1 } },
        },
        capabilities: {
          orderBy: [{ capabilityKey: "asc" }, { version: "asc" }],
          include: { grants: { orderBy: { requestedAt: "desc" } } },
        },
      },
    });

    const workflow = await prisma.workflowDefinition.findUnique({
      where: { workspaceId_slug: { workspaceId: user.workspaceId, slug: "nuru-headline-flow" } },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });

    return apiSuccess({
      actor: { userId: user.id, email: user.email, role: user.role },
      workflow: workflow ? {
        workflowVersionId: workflow.versions[0]?.id ?? null,
        version: workflow.versions[0]?.version ?? null,
        status: workflow.status,
      } : null,
      applications: applications.map((application) => ({
        applicationId: application.id,
        slug: application.slug,
        displayName: application.displayName,
        lifecycleState: application.lifecycleState,
        principals: application.servicePrincipals.map((principal) => ({
          principalId: principal.id,
          displayName: principal.displayName,
          credentialHint: principal.credentials[0]?.secretHint ?? null,
        })),
        capabilities: application.capabilities.map((capability) => ({
          capabilityId: capability.id,
          capabilityKey: capability.capabilityKey,
          version: capability.version,
          grants: capability.grants.map((grant) => ({
            grantId: grant.id,
            principalId: grant.principalId,
            status: grant.status,
            requestedById: grant.requestedById,
            scope: grant.scope,
          })),
        })),
      })),
    });
  } catch (error) {
    return apiError(error, "Unable to load reference workflow authorization status.");
  }
}
