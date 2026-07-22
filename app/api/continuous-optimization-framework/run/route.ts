import { requireContinuousOptimizationUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOptimizationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Continuous Optimization Framework."); } }
export async function POST(request: Request) { try { await requireContinuousOptimizationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Continuous Optimization Framework."); } }
