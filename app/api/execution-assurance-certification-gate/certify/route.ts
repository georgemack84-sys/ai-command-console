import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyExecutionAssuranceRequest, requireExecutionAssuranceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionAssuranceCertificationUser();
    return apiSuccess(await certifyExecutionAssuranceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to certify Execution Assurance Intelligence.");
  }
}
