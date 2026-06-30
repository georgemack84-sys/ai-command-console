import { apiError, apiSuccess } from "@/src/server/api/response";
import { recoveryRequest, requireRecoveryContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecoveryContractUser();
    return apiSuccess(await recoveryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create recovery record.");
  }
}
