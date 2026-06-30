import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceTamperDetectionRequest, requireGovernanceTamperDetectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceTamperDetectionUser();
    return apiSuccess(await inspectGovernanceTamperDetectionRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance tamper detection.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceTamperDetectionUser();
    return apiSuccess(await inspectGovernanceTamperDetectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance tamper detection.");
  }
}
