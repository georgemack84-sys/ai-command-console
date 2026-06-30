import { apiError, apiSuccess } from "@/src/server/api/response";
import { executionAssuranceCertificationVisibilityRequest, requireExecutionAssuranceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExecutionAssuranceCertificationUser();
    return apiSuccess(await executionAssuranceCertificationVisibilityRequest());
  } catch (error) {
    return apiError(error, "Unable to load Execution Assurance certification visibility.");
  }
}

export async function POST(request: Request) {
  try {
    await requireExecutionAssuranceCertificationUser();
    return apiSuccess(await executionAssuranceCertificationVisibilityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Execution Assurance certification visibility.");
  }
}
