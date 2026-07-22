import { engineRequest, requireContinuousOperationalCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await engineRequest()); } catch (error) { return apiError(error, "Unable to read certification engine."); } }
export async function POST(request: Request) { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await engineRequest(request)); } catch (error) { return apiError(error, "Unable to read certification engine."); } }
