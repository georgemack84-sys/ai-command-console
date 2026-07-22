import { apiError, apiSuccess } from "@/src/server/api/response";
import { recoveryRequest, requireRecommendationCycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationCycleUser(); return apiSuccess(await recoveryRequest()); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle recovery."); } }
export async function POST(request: Request) { try { await requireRecommendationCycleUser(); return apiSuccess(await recoveryRequest(request)); } catch (error) { return apiError(error, "Unable to recover recommendation cycle."); } }
