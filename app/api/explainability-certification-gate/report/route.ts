import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requireExplainabilityCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExplainabilityCertificationUser();
    return apiSuccess(await reportRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate explainability certification report.");
  }
}
