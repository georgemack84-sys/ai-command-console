import { apiError, apiSuccess } from "@/src/server/api/response";
import { boundariesRequest, requireAdaptiveSimulationContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveSimulationContractUser();
    return apiSuccess(await boundariesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive simulation boundaries.");
  }
}
