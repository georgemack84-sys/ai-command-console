import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireStrategyEvolutionCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStrategyEvolutionCertificationUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect strategy evolution certification gate.");
  }
}

export async function POST(request: Request) {
  try {
    await requireStrategyEvolutionCertificationUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect strategy evolution certification gate.");
  }
}
