import { apiError, apiSuccess } from "@/src/server/api/response";
import { inheritanceRequest, requireApplicationFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationFoundationUser(); return apiSuccess(await inheritanceRequest()); } catch (error) { return apiError(error, "Unable to inspect application constitutional inheritance."); } }
export async function POST(request: Request) { try { await requireApplicationFoundationUser(); return apiSuccess(await inheritanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application constitutional inheritance."); } }
