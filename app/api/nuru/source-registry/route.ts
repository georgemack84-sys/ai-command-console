import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { sourceCategories, sourceIngestionMethods, sourceRefreshPolicies } from "@/src/nuru/source-intelligence";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager, requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruSourceRegistryService } from "@/src/server/services/nuru-source-registry-service";
import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";

const submissionSchema = z.object({
  name: z.string().trim().min(1).max(180),
  domain: z.string().trim().min(1).max(253).optional(),
  baseUrl: z.string().url().optional(),
  category: z.enum(sourceCategories),
  topics: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  ingestionMethods: z.array(z.enum(sourceIngestionMethods)).min(1),
  refreshPolicy: z.enum(sourceRefreshPolicies).default("ON_DEMAND"),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return apiSuccess({ sources: await NuruSourceRegistryService.listForWorkspace(user.workspaceId) });
  } catch (error) {
    return apiError(error, "Unable to load the Nuru source registry.");
  }
}

/** New externally addressable sources always enter review; this endpoint cannot self-approve them. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    await enforceNsiWriteRateLimit(request, { operation: "write", userId: user.id, workspaceId: user.workspaceId });
    const input = submissionSchema.parse(await request.json());
    const source = await NuruSourceRegistryService.register({
      ...input,
      workspaceId: user.workspaceId,
      authorityClass: "UNKNOWN",
      admissionState: "REVIEW_REQUIRED",
      operationalState: "HEALTHY",
      enabled: true,
      requiresReview: true,
    }, `human:${user.id}`, crypto.randomUUID());
    return apiSuccess({ source }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to submit the Nuru source for review.");
  }
}
