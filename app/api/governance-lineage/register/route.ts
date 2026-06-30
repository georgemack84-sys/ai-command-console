import { apiError, apiSuccess } from "@/src/server/api/response";
import { registerGovernanceLineageRequest, requireGovernanceLineageUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceLineageUser();
    return apiSuccess(await registerGovernanceLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to register governance lineage.");
  }
}
