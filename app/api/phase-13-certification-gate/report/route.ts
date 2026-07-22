import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requirePhase13CertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase13CertificationUser(); return apiSuccess(await reportRequest()); } catch (error) { return apiError(error, "Unable to retrieve final Phase 13 certification report."); } }
export async function POST(request: Request) { try { await requirePhase13CertificationUser(); return apiSuccess(await reportRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve final Phase 13 certification report."); } }
