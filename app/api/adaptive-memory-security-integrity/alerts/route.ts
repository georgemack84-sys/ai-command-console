import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptiveMemorySecurityUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveMemorySecurityUser();
    return apiSuccess(await sectionRequest(request, "alerts"));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive memory security alerts.");
  }
}
