import { driftRequest, requireContinuousOperationalCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await driftRequest()); } catch (error) { return apiError(error, "Unable to read certification drift."); } }
export async function POST(request: Request) { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await driftRequest(request)); } catch (error) { return apiError(error, "Unable to read certification drift."); } }
