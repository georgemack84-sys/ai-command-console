import { recordRequest, requireContinuousCertificationDuringPilotUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await recordRequest()); } catch (error) { return apiError(error, "Unable to load Continuous Certification record."); } }
export async function POST(request: Request) { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await recordRequest(request)); } catch (error) { return apiError(error, "Unable to load Continuous Certification record."); } }
