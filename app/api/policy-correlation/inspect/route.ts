import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectPolicyCorrelationRequest, requirePolicyCorrelationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePolicyCorrelationUser();
    return apiSuccess(await inspectPolicyCorrelationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect PolicyCorrelation surface.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePolicyCorrelationUser();
    return apiSuccess(await inspectPolicyCorrelationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect PolicyCorrelation surface.");
  }
}
