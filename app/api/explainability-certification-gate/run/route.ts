import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireExplainabilityCertificationUser, runRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExplainabilityCertificationUser();
    return apiSuccess(await runRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run explainability certification.");
  }
}
