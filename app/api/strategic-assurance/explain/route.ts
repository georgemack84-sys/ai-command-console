import { apiError, apiSuccess } from "@/src/server/api/response";
import { explainRequest, requireStrategicAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicAssuranceUser(); return apiSuccess(await explainRequest()); } catch (error) { return apiError(error, "Unable to explain strategic assurance."); } }
export async function POST(request: Request) { try { await requireStrategicAssuranceUser(); return apiSuccess(await explainRequest(request)); } catch (error) { return apiError(error, "Unable to explain strategic assurance."); } }
