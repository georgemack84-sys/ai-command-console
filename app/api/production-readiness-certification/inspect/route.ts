import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireProductionReadinessUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionReadinessUser(); return apiSuccess(await inspectRequest()); } catch (error) { return apiError(error, "Unable to inspect production readiness certification."); } }
export async function POST(request: Request) { try { await requireProductionReadinessUser(); return apiSuccess(await inspectRequest(request)); } catch (error) { return apiError(error, "Unable to inspect production readiness certification."); } }
