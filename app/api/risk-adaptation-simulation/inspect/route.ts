import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireRiskAdaptationSimulationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskAdaptationSimulationUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect risk adaptation simulation.");
  }
}
