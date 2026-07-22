import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireReleaseArtifactBuildIntegrityUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReleaseArtifactBuildIntegrityUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run release artifact build integrity."); } }
export async function POST(request: Request) { try { await requireReleaseArtifactBuildIntegrityUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run release artifact build integrity."); } }
