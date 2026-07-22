import { apiError, apiSuccess } from "@/src/server/api/response";
import { continuousRequest, requirePhase12CertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePhase12CertificationUser(); return apiSuccess(await continuousRequest()); } catch (error) { return apiError(error, "Unable to inspect Phase 12 continuous certification."); } }
export async function POST(request: Request) { try { await requirePhase12CertificationUser(); return apiSuccess(await continuousRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Phase 12 continuous certification."); } }
