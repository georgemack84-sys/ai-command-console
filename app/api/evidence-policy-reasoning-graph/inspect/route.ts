import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireReasoningGraphUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireReasoningGraphUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect reasoning graph.");
  }
}

export async function POST(request: Request) {
  try {
    await requireReasoningGraphUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect reasoning graph.");
  }
}
