import { evidenceRequest, requirePhase17CertificationGateUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePhase17CertificationGateUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to read Phase 17 certification evidence."); } }
export async function POST(request: Request) { try { await requirePhase17CertificationGateUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to read Phase 17 certification evidence."); } }
