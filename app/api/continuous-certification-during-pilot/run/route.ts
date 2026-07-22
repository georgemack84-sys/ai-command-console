import { requireContinuousCertificationDuringPilotUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Continuous Certification During Pilot."); } }
export async function POST(request: Request) { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Continuous Certification During Pilot."); } }
