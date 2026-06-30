import { apiError, apiSuccess } from "@/src/server/api/response";
import { createExecutionAssuranceRecordRequest, requireExecutionAssuranceContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionAssuranceContractUser();
    return apiSuccess(await createExecutionAssuranceRecordRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create Execution Assurance record.");
  }
}
