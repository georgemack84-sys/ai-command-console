import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceLineageUser, resolveGovernanceLineageRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceLineageUser();
    return apiSuccess(await resolveGovernanceLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to resolve governance lineage influence chain.");
  }
}
