import { certificationRequest, requireContinuousOptimizationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOptimizationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read optimization certification."); } }
export async function POST(request: Request) { try { await requireContinuousOptimizationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read optimization certification."); } }
