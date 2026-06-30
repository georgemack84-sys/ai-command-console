import { apiError, apiSuccess } from "@/src/server/api/response";
import { appendRequest, publishRequest, requireRuntimeLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRuntimeLedgerUser();
    return apiSuccess(await publishRequest());
  } catch (error) {
    return apiError(error, "Unable to publish runtime assurance ledger.");
  }
}

export async function POST(request: Request) {
  try {
    await requireRuntimeLedgerUser();
    return apiSuccess(await appendRequest(request));
  } catch (error) {
    return apiError(error, "Unable to append runtime assurance ledger.");
  }
}
