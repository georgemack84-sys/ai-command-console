import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireReleaseArtifactBuildIntegrityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReleaseArtifactBuildIntegrityUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to load release artifact registry."); } }
export async function POST(request: Request) { try { await requireReleaseArtifactBuildIntegrityUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to load release artifact registry."); } }
