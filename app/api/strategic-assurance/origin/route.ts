import { apiError, apiSuccess } from "@/src/server/api/response";
import { originRequest, requireStrategicAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicAssuranceUser(); return apiSuccess(await originRequest()); } catch (error) { return apiError(error, "Unable to validate strategic origins."); } }
export async function POST(request: Request) { try { await requireStrategicAssuranceUser(); return apiSuccess(await originRequest(request)); } catch (error) { return apiError(error, "Unable to validate strategic origins."); } }
