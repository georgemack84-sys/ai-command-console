import { apiError, apiSuccess } from "@/src/server/api/response";
import { normalizedRequest, requireSubsystemHealthCollectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSubsystemHealthCollectionUser();
    return apiSuccess(await normalizedRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load normalized subsystem health.");
  }
}
