import { apiError, apiSuccess } from "@/src/server/api/response";
import { getExecutionAssuranceCertificationContractResponse, requireExecutionAssuranceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExecutionAssuranceCertificationUser();
    return apiSuccess(getExecutionAssuranceCertificationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Execution Assurance Certification Gate.");
  }
}
