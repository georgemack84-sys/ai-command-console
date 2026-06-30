import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectComplianceContractRequest, requireComplianceContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireComplianceContractUser();
    return apiSuccess(await inspectComplianceContractRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Compliance Contract.");
  }
}

export async function POST(request: Request) {
  try {
    await requireComplianceContractUser();
    return apiSuccess(await inspectComplianceContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Compliance Contract.");
  }
}
