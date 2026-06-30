import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomyContractUser, validateAutonomyContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAutonomyContractUser();
    return apiSuccess(await validateAutonomyContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate autonomy contract.");
  }
}
