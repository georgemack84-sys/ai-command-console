import { lifecycleRequest, requireContinuousOptimizationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOptimizationUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to read recommendation lifecycle."); } }
export async function POST(request: Request) { try { await requireContinuousOptimizationUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to read recommendation lifecycle."); } }
