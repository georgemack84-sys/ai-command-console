import { ledgerRequest, requirePilotPerformanceReliabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Performance Reliability ledger."); } }
export async function POST(request: Request) { try { await requirePilotPerformanceReliabilityUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Performance Reliability ledger."); } }
