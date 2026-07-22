import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportsRequest, requirePhase12CertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase12CertificationUser(); return apiSuccess(await reportsRequest()); } catch (error) { return apiError(error, "Unable to inspect Phase 12 certification reports."); } }
export async function POST(request: Request) { try { await requirePhase12CertificationUser(); return apiSuccess(await reportsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Phase 12 certification reports."); } }
