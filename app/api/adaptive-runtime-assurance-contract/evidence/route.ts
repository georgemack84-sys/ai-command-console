import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireAdaptiveRuntimeAssuranceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveRuntimeAssuranceUser();
    return apiSuccess(await evidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive runtime evidence.");
  }
}
