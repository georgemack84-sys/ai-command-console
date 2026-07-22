import { apiError, apiSuccess } from "@/src/server/api/response";
import { constraintsRequest, requireApplicationFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationFoundationUser(); return apiSuccess(await constraintsRequest()); } catch (error) { return apiError(error, "Unable to inspect application architectural constraints."); } }
export async function POST(request: Request) { try { await requireApplicationFoundationUser(); return apiSuccess(await constraintsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application architectural constraints."); } }
