import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApplicationFoundationUser, taxonomyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationFoundationUser(); return apiSuccess(await taxonomyRequest()); } catch (error) { return apiError(error, "Unable to inspect application taxonomy."); } }
export async function POST(request: Request) { try { await requireApplicationFoundationUser(); return apiSuccess(await taxonomyRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application taxonomy."); } }
