import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRequest, requireStrategicAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicAssuranceUser(); return apiSuccess(await integrityRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic integrity."); } }
export async function POST(request: Request) { try { await requireStrategicAssuranceUser(); return apiSuccess(await integrityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic integrity."); } }
