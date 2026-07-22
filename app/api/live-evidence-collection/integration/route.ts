import { integrationRequest, requireLiveEvidenceCollectionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await integrationRequest()); } catch (error) { return apiError(error, "Unable to load Live Evidence Collection integration."); } }
export async function POST(request: Request) { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await integrationRequest(request)); } catch (error) { return apiError(error, "Unable to load Live Evidence Collection integration."); } }
