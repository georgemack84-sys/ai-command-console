import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireComplianceContractUser, transitionComplianceContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceContractUser();
    return apiSuccess(await transitionComplianceContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to transition Compliance Contract lifecycle.");
  }
}
