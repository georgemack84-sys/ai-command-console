import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireRecommendationCycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationCycleUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle ledger."); } }
export async function POST(request: Request) { try { await requireRecommendationCycleUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle ledger."); } }
