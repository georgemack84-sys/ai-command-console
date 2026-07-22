import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireReplayIntegrityExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load replay certification."); } }
export async function POST(request: Request) { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load replay certification."); } }
