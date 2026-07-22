import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptiveDashboardFoundationUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveDashboardFoundationUser();
    return apiSuccess(await sectionRequest(request, "view_registry"));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive dashboard views.");
  }
}
