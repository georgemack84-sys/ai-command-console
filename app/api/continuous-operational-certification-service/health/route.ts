import { healthRequest, requireContinuousOperationalCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await healthRequest()); } catch (error) { return apiError(error, "Unable to read certification health."); } }
export async function POST(request: Request) { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await healthRequest(request)); } catch (error) { return apiError(error, "Unable to read certification health."); } }
