import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyRequest, requireAssuranceStateUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAssuranceStateUser();
    return apiSuccess(await certifyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to certify assurance state.");
  }
}
