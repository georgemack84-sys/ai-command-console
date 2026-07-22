import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireInstitutionalMemoryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireInstitutionalMemoryUser();
    return apiSuccess(await ledgerRequest());
  } catch (error) {
    return apiError(error, "Unable to retrieve institutional memory ledger.");
  }
}

export async function POST(request: Request) {
  try {
    await requireInstitutionalMemoryUser();
    return apiSuccess(await ledgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect institutional memory ledger.");
  }
}
