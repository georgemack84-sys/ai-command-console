import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireOperatorImpactDashboardUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOperatorImpactDashboardUser();
    return apiSuccess(await sectionRequest(request, "override_pattern_view"));
  } catch (error) {
    return apiError(error, "Unable to retrieve override pattern view.");
  }
}
