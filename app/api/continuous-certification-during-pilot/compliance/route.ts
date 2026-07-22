import { complianceRequest, requireContinuousCertificationDuringPilotUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await complianceRequest()); } catch (error) { return apiError(error, "Unable to load Continuous Certification compliance."); } }
export async function POST(request: Request) { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await complianceRequest(request)); } catch (error) { return apiError(error, "Unable to load Continuous Certification compliance."); } }
