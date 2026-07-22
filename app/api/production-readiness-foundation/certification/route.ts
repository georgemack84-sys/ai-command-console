import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireProductionReadinessFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionReadinessFoundationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load production readiness certification."); } }
export async function POST(request: Request) { try { await requireProductionReadinessFoundationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load production readiness certification."); } }
