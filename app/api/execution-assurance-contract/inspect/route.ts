import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectExecutionAssuranceRecordRequest, requireExecutionAssuranceContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExecutionAssuranceContractUser();
    return apiSuccess(await inspectExecutionAssuranceRecordRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Execution Assurance record.");
  }
}

export async function POST(request: Request) {
  try {
    await requireExecutionAssuranceContractUser();
    return apiSuccess(await inspectExecutionAssuranceRecordRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Execution Assurance record.");
  }
}
