import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceSecurityRequest, requireDriftDefenseCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftDefenseCertificationUser();
    return apiSuccess(await governanceSecurityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance security certification.");
  }
}
