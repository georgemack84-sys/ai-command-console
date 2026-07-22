import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategyEvolutionDashboardUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyEvolutionDashboardUser();
    return apiSuccess(await sectionRequest(request, "proposal_queue"));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy proposal queue.");
  }
}
