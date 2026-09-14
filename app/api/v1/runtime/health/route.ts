import { GET as getContinuity } from "../continuity/route";

// Route-segment configuration must be declared directly in this module for Next.js to statically analyze it.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return getContinuity(request);
}
