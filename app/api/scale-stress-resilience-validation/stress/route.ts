import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireScaleStressResilienceUser, stressRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScaleStressResilienceUser(); return apiSuccess(await stressRequest()); } catch (error) { return apiError(error, "Unable to load stress validation."); } }
export async function POST(request: Request) { try { await requireScaleStressResilienceUser(); return apiSuccess(await stressRequest(request)); } catch (error) { return apiError(error, "Unable to load stress validation."); } }
