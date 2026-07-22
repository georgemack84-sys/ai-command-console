import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePolicyManifestUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePolicyManifestUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect policy manifest contract."); } }
