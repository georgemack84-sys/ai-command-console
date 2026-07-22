import { apiError, apiSuccess } from "@/src/server/api/response";
import { manifestRequest, requirePolicyManifestUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePolicyManifestUser(); return apiSuccess(await manifestRequest()); } catch (error) { return apiError(error, "Unable to inspect policy manifest."); } }
export async function POST(request: Request) { try { await requirePolicyManifestUser(); return apiSuccess(await manifestRequest(request)); } catch (error) { return apiError(error, "Unable to inspect policy manifest."); } }
