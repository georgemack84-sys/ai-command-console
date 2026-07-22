import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireStrategicAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicAssuranceUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic lineage."); } }
export async function POST(request: Request) { try { await requireStrategicAssuranceUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic lineage."); } }
