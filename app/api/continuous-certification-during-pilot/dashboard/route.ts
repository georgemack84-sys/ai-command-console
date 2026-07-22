import { dashboardRequest, requireContinuousCertificationDuringPilotUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to load Continuous Certification dashboard."); } }
export async function POST(request: Request) { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to load Continuous Certification dashboard."); } }
