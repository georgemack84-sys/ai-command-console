import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireCounterfactualSimulatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCounterfactualSimulatorUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve counterfactual simulator contract.");
  }
}
