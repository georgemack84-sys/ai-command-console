import { requireLiveEvidenceCollectionUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Live Evidence Collection."); } }
export async function POST(request: Request) { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Live Evidence Collection."); } }
