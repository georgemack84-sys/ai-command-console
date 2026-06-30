import { apiError, apiSuccess } from "@/src/server/api/response";
import { classifyTaskRequest, requireTaskClassificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireTaskClassificationUser();
    return apiSuccess(await classifyTaskRequest(request));
  } catch (error) {
    return apiError(error, "Unable to classify task.");
  }
}
