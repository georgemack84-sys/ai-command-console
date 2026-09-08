import { buildHouseholdContext } from "../../../../lib/context/context-engine";
import { requireHouseholdAccess } from "../../../../lib/self-hosted/access";
export const runtime = "nodejs";
export async function GET(request: Request) { const unauthorized = requireHouseholdAccess(request); if (unauthorized) return unauthorized; try { return Response.json((await buildHouseholdContext()).insights); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to build household context." }, { status: 503 }); } }
