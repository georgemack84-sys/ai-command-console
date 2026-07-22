import { apiError, apiSuccess } from "@/src/server/api/response";
import { bindingRequest, requirePolicyManifestUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePolicyManifestUser(); return apiSuccess(await bindingRequest()); } catch (error) { return apiError(error, "Unable to inspect policy binding."); } }
export async function POST(request: Request) { try { await requirePolicyManifestUser(); return apiSuccess(await bindingRequest(request)); } catch (error) { return apiError(error, "Unable to inspect policy binding."); } }
