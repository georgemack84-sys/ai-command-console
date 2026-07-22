import { constitutionalRequest, requireContinuousAdaptiveOperationsCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousAdaptiveOperationsCertificationUser(); return apiSuccess(await constitutionalRequest()); } catch (error) { return apiError(error, "Unable to read Phase 18 constitutional validation."); } }
export async function POST(request: Request) { try { await requireContinuousAdaptiveOperationsCertificationUser(); return apiSuccess(await constitutionalRequest(request)); } catch (error) { return apiError(error, "Unable to read Phase 18 constitutional validation."); } }
