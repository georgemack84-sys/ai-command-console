import { apiError, apiSuccess } from "@/src/server/api/response";
import { doctrineRequest, requireApplicationFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationFoundationUser(); return apiSuccess(await doctrineRequest()); } catch (error) { return apiError(error, "Unable to inspect application doctrine."); } }
export async function POST(request: Request) { try { await requireApplicationFoundationUser(); return apiSuccess(await doctrineRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application doctrine."); } }
