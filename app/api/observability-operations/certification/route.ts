import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireObservabilityOperationsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireObservabilityOperationsUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load observability certification."); } }
export async function POST(request: Request) { try { await requireObservabilityOperationsUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load observability certification."); } }
