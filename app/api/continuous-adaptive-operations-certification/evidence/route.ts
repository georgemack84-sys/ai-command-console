import { evidenceRequest, requireContinuousAdaptiveOperationsCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousAdaptiveOperationsCertificationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to read Phase 18 certification evidence."); } }
export async function POST(request: Request) { try { await requireContinuousAdaptiveOperationsCertificationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to read Phase 18 certification evidence."); } }
