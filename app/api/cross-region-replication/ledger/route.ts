import { ledgerRequest, requireCrossRegionReplicationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireCrossRegionReplicationUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to read replication ledger."); } }
export async function POST(request: Request) { try { await requireCrossRegionReplicationUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to read replication ledger."); } }
