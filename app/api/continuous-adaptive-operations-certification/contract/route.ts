import { contractResponse, requireContinuousAdaptiveOperationsCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousAdaptiveOperationsCertificationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Continuous Adaptive Operations Certification contract."); } }
