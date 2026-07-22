import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRequest, requireReleaseArtifactBuildIntegrityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReleaseArtifactBuildIntegrityUser(); return apiSuccess(await integrityRequest()); } catch (error) { return apiError(error, "Unable to load artifact integrity."); } }
export async function POST(request: Request) { try { await requireReleaseArtifactBuildIntegrityUser(); return apiSuccess(await integrityRequest(request)); } catch (error) { return apiError(error, "Unable to load artifact integrity."); } }
