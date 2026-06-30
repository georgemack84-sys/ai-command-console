import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceLineageUser, retrieveGovernanceLineageRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceLineageUser();
    return apiSuccess(await retrieveGovernanceLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance lineage.");
  }
}
