import { contractResponse, requireContinuousOptimizationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOptimizationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Continuous Optimization Framework contract."); } }
