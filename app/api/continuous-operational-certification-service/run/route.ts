import { requireContinuousOperationalCertificationUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Continuous Operational Certification Service."); } }
export async function POST(request: Request) { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Continuous Operational Certification Service."); } }
