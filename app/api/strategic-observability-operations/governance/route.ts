import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireStrategicOperationsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicOperationsUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect governance operations."); } }
export async function POST(request: Request) { try { await requireStrategicOperationsUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect governance operations."); } }
