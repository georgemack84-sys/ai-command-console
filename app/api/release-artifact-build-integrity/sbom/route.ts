import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireReleaseArtifactBuildIntegrityUser, sbomRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReleaseArtifactBuildIntegrityUser(); return apiSuccess(await sbomRequest()); } catch (error) { return apiError(error, "Unable to load artifact SBOM."); } }
export async function POST(request: Request) { try { await requireReleaseArtifactBuildIntegrityUser(); return apiSuccess(await sbomRequest(request)); } catch (error) { return apiError(error, "Unable to load artifact SBOM."); } }
