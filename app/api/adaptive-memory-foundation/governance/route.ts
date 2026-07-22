import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireAdaptiveMemoryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveMemoryUser();
    return apiSuccess(await governanceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive memory governance validation.");
  }
}
