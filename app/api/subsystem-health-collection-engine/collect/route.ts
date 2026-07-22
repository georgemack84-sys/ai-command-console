import { apiError, apiSuccess } from "@/src/server/api/response";
import { collectRequest, requireSubsystemHealthCollectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSubsystemHealthCollectionUser();
    return apiSuccess(await collectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to collect subsystem health.");
  }
}
