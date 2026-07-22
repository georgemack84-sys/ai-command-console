import { registryRequest, requireLiveEvidenceCollectionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to load Live Evidence Collection registry."); } }
export async function POST(request: Request) { try { await requireLiveEvidenceCollectionUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to load Live Evidence Collection registry."); } }
