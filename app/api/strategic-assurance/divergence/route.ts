import { apiError, apiSuccess } from "@/src/server/api/response";
import { divergenceRequest, requireStrategicAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicAssuranceUser(); return apiSuccess(await divergenceRequest()); } catch (error) { return apiError(error, "Unable to classify replay divergence."); } }
export async function POST(request: Request) { try { await requireStrategicAssuranceUser(); return apiSuccess(await divergenceRequest(request)); } catch (error) { return apiError(error, "Unable to classify replay divergence."); } }
