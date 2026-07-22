import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsRequest, requireProposalLifecycleUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireProposalLifecycleUser();
    return apiSuccess(await metricsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve proposal lifecycle metrics.");
  }
}
