import { integrityRequest, requireLiveEvidenceCollectionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await integrityRequest()); } catch (error) { return apiError(error, "Unable to load Live Evidence Collection integrity validation."); } }
export async function POST(request: Request) { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await integrityRequest(request)); } catch (error) { return apiError(error, "Unable to load Live Evidence Collection integrity validation."); } }
