import { apiError, apiSuccess } from "@/src/server/api/response";
import { executionAssuranceCertificationReplayRequest, requireExecutionAssuranceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionAssuranceCertificationUser();
    return apiSuccess(await executionAssuranceCertificationReplayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Execution Assurance certification.");
  }
}
