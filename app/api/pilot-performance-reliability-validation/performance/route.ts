import { performanceRequest, requirePilotPerformanceReliabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await performanceRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Performance Reliability performance validation."); } }
export async function POST(request: Request) { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await performanceRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Performance Reliability performance validation."); } }
