import { evidenceRequest, requireLiveEvidenceCollectionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to load Live Evidence Collection evidence."); } }
export async function POST(request: Request) { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to load Live Evidence Collection evidence."); } }
