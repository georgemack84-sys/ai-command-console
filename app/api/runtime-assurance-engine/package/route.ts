import { apiError, apiSuccess } from "@/src/server/api/response";
import { createRuntimeAssurancePackageRequest, requireRuntimeAssuranceEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeAssuranceEngineUser();
    return apiSuccess(await createRuntimeAssurancePackageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create Runtime Assurance package.");
  }
}
