import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireDecisionNarrativeUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDecisionNarrativeUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect decision narrative engine.");
  }
}

export async function POST(request: Request) {
  try {
    await requireDecisionNarrativeUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect decision narrative engine.");
  }
}
