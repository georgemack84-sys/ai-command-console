import { certificationRequest, requireLiveEvidenceCollectionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load Live Evidence Collection certification."); } }
export async function POST(request: Request) { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Live Evidence Collection certification."); } }
