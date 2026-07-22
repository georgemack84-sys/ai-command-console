import { lineageRequest, requireLiveEvidenceCollectionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to load Live Evidence Collection lineage."); } }
export async function POST(request: Request) { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to load Live Evidence Collection lineage."); } }
