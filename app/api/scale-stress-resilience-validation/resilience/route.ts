import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireScaleStressResilienceUser, resilienceRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScaleStressResilienceUser(); return apiSuccess(await resilienceRequest()); } catch (error) { return apiError(error, "Unable to load resilience validation."); } }
export async function POST(request: Request) { try { await requireScaleStressResilienceUser(); return apiSuccess(await resilienceRequest(request)); } catch (error) { return apiError(error, "Unable to load resilience validation."); } }
