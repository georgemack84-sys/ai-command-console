import { requirePilotPerformanceReliabilityUser, vp1Request } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await vp1Request()); } catch (error) { return apiError(error, "Unable to load Pilot Performance Reliability VP1 report."); } }
export async function POST(request: Request) { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await vp1Request(request)); } catch (error) { return apiError(error, "Unable to load Pilot Performance Reliability VP1 report."); } }
