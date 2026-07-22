import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategyEvolutionDashboardUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyEvolutionDashboardUser();
    return apiSuccess(await sectionRequest(request, "simulation_view"));
  } catch (error) {
    return apiError(error, "Unable to retrieve simulation progress view.");
  }
}
