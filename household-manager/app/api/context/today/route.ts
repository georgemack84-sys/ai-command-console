import { buildHouseholdContext } from "../../../../lib/context/context-engine";
import { requireHouseholdAccess } from "../../../../lib/self-hosted/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireHouseholdAccess(request); if (unauthorized) return unauthorized;
  try { return Response.json(await buildHouseholdContext(), { headers: { "Cache-Control": "private, max-age=60" } }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to build household context." }, { status: 503 }); }
}
