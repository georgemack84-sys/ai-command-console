import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireMissionHealthCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMissionHealthCertificationUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect mission health certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireMissionHealthCertificationUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect mission health certification.");
  }
}
