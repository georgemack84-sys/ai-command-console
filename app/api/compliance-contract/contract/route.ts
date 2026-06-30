import { apiError, apiSuccess } from "@/src/server/api/response";
import { getComplianceContract, requireComplianceContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireComplianceContractUser();
    return apiSuccess(getComplianceContract());
  } catch (error) {
    return apiError(error, "Unable to load Compliance Contract.");
  }
}
