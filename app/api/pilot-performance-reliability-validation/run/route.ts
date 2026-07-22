import { requirePilotPerformanceReliabilityUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Pilot Performance Reliability Validation."); } }
export async function POST(request: Request) { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Pilot Performance Reliability Validation."); } }
