import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomyMaturityUser, schemaRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomyMaturityUser(); return apiSuccess(await schemaRequest(request)); }
  catch (error) { return apiError(error, "Unable to load autonomy maturity schema."); }
}
