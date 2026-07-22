import { apiError, apiSuccess } from "@/src/server/api/response";
import { domainsRequest, requireAutonomyMaturityUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomyMaturityUser(); return apiSuccess(await domainsRequest(request)); }
  catch (error) { return apiError(error, "Unable to list autonomy maturity domains."); }
}
