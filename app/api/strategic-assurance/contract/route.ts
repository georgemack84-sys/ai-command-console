import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireStrategicAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicAssuranceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect strategic assurance contract."); } }
