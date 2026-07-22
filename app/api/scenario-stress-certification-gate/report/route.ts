import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requireScenarioStressCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireScenarioStressCertificationUser();
    return apiSuccess(await reportRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate scenario stress certification report.");
  }
}
