import { apiError, apiSuccess } from "@/src/server/api/response";
import { manifestRequest, requireReleaseArtifactBuildIntegrityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReleaseArtifactBuildIntegrityUser(); return apiSuccess(await manifestRequest()); } catch (error) { return apiError(error, "Unable to load build manifest."); } }
export async function POST(request: Request) { try { await requireReleaseArtifactBuildIntegrityUser(); return apiSuccess(await manifestRequest(request)); } catch (error) { return apiError(error, "Unable to load build manifest."); } }
