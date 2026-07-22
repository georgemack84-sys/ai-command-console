import { apiError, apiSuccess } from "@/src/server/api/response";
import { identityRequest, requireAdaptiveMemoryStoreUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveMemoryStoreUser();
    return apiSuccess(await identityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive memory identities.");
  }
}
