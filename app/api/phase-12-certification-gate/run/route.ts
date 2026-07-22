import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePhase12CertificationUser, runRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase12CertificationUser(); return apiSuccess(await runRequest()); } catch (error) { return apiError(error, "Unable to run Phase 12 certification gate."); } }
export async function POST(request: Request) { try { await requirePhase12CertificationUser(); return apiSuccess(await runRequest(request)); } catch (error) { return apiError(error, "Unable to run Phase 12 certification gate."); } }
