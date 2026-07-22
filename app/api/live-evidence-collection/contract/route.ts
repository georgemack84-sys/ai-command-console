import { contractResponse, requireLiveEvidenceCollectionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Live Evidence Collection contract."); } }
