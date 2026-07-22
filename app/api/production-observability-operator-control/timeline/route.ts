import { requireProductionObservabilityUser, timelineRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionObservabilityUser(); return apiSuccess(await timelineRequest()); } catch (error) { return apiError(error, "Unable to load operational timeline."); } }
export async function POST(request: Request) { try { await requireProductionObservabilityUser(); return apiSuccess(await timelineRequest(request)); } catch (error) { return apiError(error, "Unable to load operational timeline."); } }
