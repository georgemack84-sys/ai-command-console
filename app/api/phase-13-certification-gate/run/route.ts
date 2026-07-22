import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePhase13CertificationUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase13CertificationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Phase 13 certification gate."); } }
export async function POST(request: Request) { try { await requirePhase13CertificationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Phase 13 certification gate."); } }
