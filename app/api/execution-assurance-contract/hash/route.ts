import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashExecutionAssuranceRecordRequest, requireExecutionAssuranceContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionAssuranceContractUser();
    return apiSuccess(await hashExecutionAssuranceRecordRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash Execution Assurance record.");
  }
}
