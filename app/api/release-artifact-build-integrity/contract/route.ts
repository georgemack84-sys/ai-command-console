import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireReleaseArtifactBuildIntegrityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReleaseArtifactBuildIntegrityUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load release artifact build integrity contract."); } }
