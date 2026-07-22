import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireProposalLifecycleUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireProposalLifecycleUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve proposal lifecycle contract.");
  }
}
