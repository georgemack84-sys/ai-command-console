import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireScenarioStressCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireScenarioStressCertificationUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect scenario stress certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireScenarioStressCertificationUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect scenario stress certification.");
  }
}
