import { certificationRequest, requirePhase17CertificationGateUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePhase17CertificationGateUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read Phase 17 certification package."); } }
export async function POST(request: Request) { try { await requirePhase17CertificationGateUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read Phase 17 certification package."); } }
