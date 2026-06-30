import { apiError, apiSuccess } from "@/src/server/api/response";
import { recommendationRequest, requireRecoveryContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecoveryContractUser();
    return apiSuccess(await recommendationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load recovery recommendation.");
  }
}
