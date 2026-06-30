import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRecoveryContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecoveryContractUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load recovery contract.");
  }
}
