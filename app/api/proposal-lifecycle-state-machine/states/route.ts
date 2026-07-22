import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireProposalLifecycleUser, statesRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireProposalLifecycleUser();
    return apiSuccess(await statesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve proposal lifecycle states.");
  }
}
