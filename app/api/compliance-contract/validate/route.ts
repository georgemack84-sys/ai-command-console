import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireComplianceContractUser, validateComplianceContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceContractUser();
    return apiSuccess(await validateComplianceContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Compliance Contract.");
  }
}
