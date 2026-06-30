import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayExecutionAssuranceRecordRequest, requireExecutionAssuranceContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionAssuranceContractUser();
    return apiSuccess(await replayExecutionAssuranceRecordRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Execution Assurance record.");
  }
}
