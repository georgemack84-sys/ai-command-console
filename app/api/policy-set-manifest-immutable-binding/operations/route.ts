import { apiError, apiSuccess } from "@/src/server/api/response";
import { operationsRequest, requirePolicyManifestUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePolicyManifestUser(); return apiSuccess(await operationsRequest()); } catch (error) { return apiError(error, "Unable to inspect policy manifest operations."); } }
export async function POST(request: Request) { try { await requirePolicyManifestUser(); return apiSuccess(await operationsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect policy manifest operations."); } }
