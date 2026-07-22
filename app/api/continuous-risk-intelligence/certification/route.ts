import { certificationRequest, requireContinuousRiskIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read risk certification."); } }
export async function POST(request: Request) { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read risk certification."); } }
