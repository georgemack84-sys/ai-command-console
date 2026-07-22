import { apiError, apiSuccess } from "@/src/server/api/response";
import { baselineRequest, requireGovernanceAuthorityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceAuthorityUser();
    return apiSuccess(await baselineRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance authority baseline.");
  }
}
