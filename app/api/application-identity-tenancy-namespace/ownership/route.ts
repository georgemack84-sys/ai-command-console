import { apiError, apiSuccess } from "@/src/server/api/response";
import { ownershipRequest, requireApplicationIdentityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIdentityUser(); return apiSuccess(await ownershipRequest()); } catch (error) { return apiError(error, "Unable to inspect application ownership."); } }
export async function POST(request: Request) { try { await requireApplicationIdentityUser(); return apiSuccess(await ownershipRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application ownership."); } }
