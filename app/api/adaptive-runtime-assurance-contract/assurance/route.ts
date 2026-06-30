import { apiError, apiSuccess } from "@/src/server/api/response";
import { assuranceRequest, inspectRequest, requireAdaptiveRuntimeAssuranceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptiveRuntimeAssuranceUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect adaptive runtime assurance.");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdaptiveRuntimeAssuranceUser();
    return apiSuccess(await assuranceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create adaptive runtime assurance.");
  }
}
