import { certificationRequest, requirePilotPerformanceReliabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Performance Reliability certification."); } }
export async function POST(request: Request) { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Performance Reliability certification."); } }
