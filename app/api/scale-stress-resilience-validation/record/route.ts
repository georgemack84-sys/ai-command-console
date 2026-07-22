import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordRequest, requireScaleStressResilienceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScaleStressResilienceUser(); return apiSuccess(await recordRequest()); } catch (error) { return apiError(error, "Unable to load scale validation record."); } }
export async function POST(request: Request) { try { await requireScaleStressResilienceUser(); return apiSuccess(await recordRequest(request)); } catch (error) { return apiError(error, "Unable to load scale validation record."); } }
