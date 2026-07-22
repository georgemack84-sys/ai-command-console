import { recommendationsRequest, requireContinuousOptimizationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOptimizationUser(); return apiSuccess(await recommendationsRequest()); } catch (error) { return apiError(error, "Unable to read optimization recommendations."); } }
export async function POST(request: Request) { try { await requireContinuousOptimizationUser(); return apiSuccess(await recommendationsRequest(request)); } catch (error) { return apiError(error, "Unable to read optimization recommendations."); } }
