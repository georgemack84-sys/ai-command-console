import { eventsRequest, requireContinuousOperationalCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await eventsRequest()); } catch (error) { return apiError(error, "Unable to read certification events."); } }
export async function POST(request: Request) { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await eventsRequest(request)); } catch (error) { return apiError(error, "Unable to read certification events."); } }
