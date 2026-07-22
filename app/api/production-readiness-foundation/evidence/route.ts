import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireProductionReadinessFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionReadinessFoundationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to load production evidence requirements."); } }
export async function POST(request: Request) { try { await requireProductionReadinessFoundationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to load production evidence requirements."); } }
