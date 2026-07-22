import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyRequest, inspectRequest, requireAdaptiveMemoryCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptiveMemoryCertificationUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect adaptive memory certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdaptiveMemoryCertificationUser();
    return apiSuccess(await certifyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run adaptive memory certification.");
  }
}
