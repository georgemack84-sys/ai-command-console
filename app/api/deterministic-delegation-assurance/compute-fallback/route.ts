import { apiError, apiSuccess } from "@/src/server/api/response";
import { computeFallbackRequest, requireDeterministicDelegationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try { await requireDeterministicDelegationUser(); return apiSuccess(await computeFallbackRequest(request)); }
  catch (error) { return apiError(error, "Unable to compute deterministic delegation fallback route."); }
}
