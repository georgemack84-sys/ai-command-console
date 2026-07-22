import { apiError, apiSuccess } from "@/src/server/api/response";
import { namespaceRequest, requireApplicationIdentityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIdentityUser(); return apiSuccess(await namespaceRequest()); } catch (error) { return apiError(error, "Unable to inspect application namespace."); } }
export async function POST(request: Request) { try { await requireApplicationIdentityUser(); return apiSuccess(await namespaceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application namespace."); } }
