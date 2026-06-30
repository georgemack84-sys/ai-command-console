import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRuntimeAssuranceEngineUser, runtimeAssuranceEvidenceRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeAssuranceEngineUser();
    return apiSuccess(await runtimeAssuranceEvidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create Runtime Assurance evidence.");
  }
}
