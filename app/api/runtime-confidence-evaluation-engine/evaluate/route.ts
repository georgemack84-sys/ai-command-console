import { apiError, apiSuccess } from "@/src/server/api/response";
import { evaluateRequest, publishRequest, requireRuntimeConfidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRuntimeConfidenceUser();
    return apiSuccess(await publishRequest());
  } catch (error) {
    return apiError(error, "Unable to publish runtime confidence.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRuntimeConfidenceUser();
    return apiSuccess(await evaluateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to evaluate runtime confidence.");
  }
}
