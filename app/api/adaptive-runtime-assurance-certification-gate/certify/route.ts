import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyRequest, inspectRequest, requireAdaptiveRuntimeCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptiveRuntimeCertificationUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect adaptive runtime certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdaptiveRuntimeCertificationUser();
    return apiSuccess(await certifyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run adaptive runtime certification.");
  }
}
