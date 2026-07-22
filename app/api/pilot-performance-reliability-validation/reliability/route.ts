import { reliabilityRequest, requirePilotPerformanceReliabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await reliabilityRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Performance Reliability reliability validation."); } }
export async function POST(request: Request) { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await reliabilityRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Performance Reliability reliability validation."); } }
