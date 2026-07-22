import { certificationRequest, requireContinuousCertificationDuringPilotUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load Continuous Certification tests."); } }
export async function POST(request: Request) { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Continuous Certification tests."); } }
