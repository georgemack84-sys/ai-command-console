import { apiError, apiSuccess } from "@/src/server/api/response";
import { boundariesRequest, requireApplicationFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationFoundationUser(); return apiSuccess(await boundariesRequest()); } catch (error) { return apiError(error, "Unable to inspect application boundaries."); } }
export async function POST(request: Request) { try { await requireApplicationFoundationUser(); return apiSuccess(await boundariesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application boundaries."); } }
