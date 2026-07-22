import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRiskAdaptationSimulationUser, runRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskAdaptationSimulationUser();
    return apiSuccess(await runRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run risk adaptation simulation.");
  }
}
