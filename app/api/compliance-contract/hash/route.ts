import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashComplianceContractRequest, requireComplianceContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceContractUser();
    return apiSuccess(await hashComplianceContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash Compliance Contract.");
  }
}
