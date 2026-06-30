import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRecoveryValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecoveryValidationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load recovery validation engine contract.");
  }
}
