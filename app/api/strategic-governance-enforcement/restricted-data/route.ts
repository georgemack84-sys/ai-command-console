import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategicGovernanceUser, restrictedDataRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicGovernanceUser(); return apiSuccess(await restrictedDataRequest()); } catch (error) { return apiError(error, "Unable to protect restricted strategic data."); } }
export async function POST(request: Request) { try { await requireStrategicGovernanceUser(); return apiSuccess(await restrictedDataRequest(request)); } catch (error) { return apiError(error, "Unable to protect restricted strategic data."); } }
