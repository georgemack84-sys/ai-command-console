import { preconditionsRequest, requireContinuousAdaptiveOperationsCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousAdaptiveOperationsCertificationUser(); return apiSuccess(await preconditionsRequest()); } catch (error) { return apiError(error, "Unable to read Phase 18 certification preconditions."); } }
export async function POST(request: Request) { try { await requireContinuousAdaptiveOperationsCertificationUser(); return apiSuccess(await preconditionsRequest(request)); } catch (error) { return apiError(error, "Unable to read Phase 18 certification preconditions."); } }
