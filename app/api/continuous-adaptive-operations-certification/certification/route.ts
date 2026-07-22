import { certificationRequest, requireContinuousAdaptiveOperationsCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousAdaptiveOperationsCertificationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read Phase 18 certification package."); } }
export async function POST(request: Request) { try { await requireContinuousAdaptiveOperationsCertificationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read Phase 18 certification package."); } }
