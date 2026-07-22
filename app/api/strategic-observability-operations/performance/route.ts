import { apiError, apiSuccess } from "@/src/server/api/response";
import { performanceRequest, requireStrategicOperationsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicOperationsUser(); return apiSuccess(await performanceRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic performance."); } }
export async function POST(request: Request) { try { await requireStrategicOperationsUser(); return apiSuccess(await performanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic performance."); } }
