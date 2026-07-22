import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationCycleUser, transactionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationCycleUser(); return apiSuccess(await transactionRequest()); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle transaction."); } }
export async function POST(request: Request) { try { await requireRecommendationCycleUser(); return apiSuccess(await transactionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle transaction."); } }
