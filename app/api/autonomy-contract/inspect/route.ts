import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectAutonomyContractRequest, requireAutonomyContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAutonomyContractUser();
    return apiSuccess(await inspectAutonomyContractRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect autonomy contract.");
  }
}

export async function POST(request: Request) {
  try {
    await requireAutonomyContractUser();
    return apiSuccess(await inspectAutonomyContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect autonomy contract.");
  }
}
