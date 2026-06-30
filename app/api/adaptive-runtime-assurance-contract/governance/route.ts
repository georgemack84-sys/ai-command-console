import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireAdaptiveRuntimeAssuranceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveRuntimeAssuranceUser();
    return apiSuccess(await governanceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate adaptive runtime governance.");
  }
}
