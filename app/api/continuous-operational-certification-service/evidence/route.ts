import { evidenceRequest, requireContinuousOperationalCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to read certification evidence."); } }
export async function POST(request: Request) { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to read certification evidence."); } }
