import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireOperatorImpactDashboardUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOperatorImpactDashboardUser();
    return apiSuccess(await sectionRequest(request, "trend_explorer"));
  } catch (error) {
    return apiError(error, "Unable to retrieve operator trend explorer.");
  }
}
