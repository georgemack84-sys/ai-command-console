import { engineRequest, requireContinuousCertificationDuringPilotUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await engineRequest()); } catch (error) { return apiError(error, "Unable to load Continuous Certification engine."); } }
export async function POST(request: Request) { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await engineRequest(request)); } catch (error) { return apiError(error, "Unable to load Continuous Certification engine."); } }
