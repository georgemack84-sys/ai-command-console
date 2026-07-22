import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApplicationIdentityUser, synchronizationRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIdentityUser(); return apiSuccess(await synchronizationRequest()); } catch (error) { return apiError(error, "Unable to inspect registry synchronization."); } }
export async function POST(request: Request) { try { await requireApplicationIdentityUser(); return apiSuccess(await synchronizationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect registry synchronization."); } }
