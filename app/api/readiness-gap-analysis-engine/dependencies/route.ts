import { apiError, apiSuccess } from "@/src/server/api/response";
import { dependenciesRequest, requireReadinessGapUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReadinessGapUser(); return apiSuccess(await dependenciesRequest(request)); }
  catch (error) { return apiError(error, "Unable to list readiness dependencies."); }
}
