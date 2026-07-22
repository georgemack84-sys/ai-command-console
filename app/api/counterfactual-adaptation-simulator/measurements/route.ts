import { apiError, apiSuccess } from "@/src/server/api/response";
import { measurementsRequest, requireCounterfactualSimulatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireCounterfactualSimulatorUser();
    return apiSuccess(await measurementsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve counterfactual measurements.");
  }
}
