import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireTrustEvidenceConfidenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect trust evidence registry."); } }
export async function POST(request: Request) { try { await requireTrustEvidenceConfidenceUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to project trust evidence registry."); } }
