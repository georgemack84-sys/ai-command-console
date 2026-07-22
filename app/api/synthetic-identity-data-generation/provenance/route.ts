import { apiError, apiSuccess } from "@/src/server/api/response";
import { provenanceRequest, requireSyntheticIdentityDataGenerationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await provenanceRequest()); } catch (error) { return apiError(error, "Unable to load synthetic provenance."); } }
export async function POST(request: Request) { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await provenanceRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic provenance."); } }
