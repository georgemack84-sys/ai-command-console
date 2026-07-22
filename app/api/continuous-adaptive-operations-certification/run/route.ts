import { requireContinuousAdaptiveOperationsCertificationUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousAdaptiveOperationsCertificationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Continuous Adaptive Operations Certification."); } }
export async function POST(request: Request) { try { await requireContinuousAdaptiveOperationsCertificationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Continuous Adaptive Operations Certification."); } }
