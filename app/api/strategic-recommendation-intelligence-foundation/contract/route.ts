import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireStrategicFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicFoundationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect strategic foundation contract."); } }
