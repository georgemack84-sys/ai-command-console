import { requirePilotPerformanceReliabilityUser, thresholdsRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await thresholdsRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Performance Reliability thresholds."); } }
export async function POST(request: Request) { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await thresholdsRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Performance Reliability thresholds."); } }
