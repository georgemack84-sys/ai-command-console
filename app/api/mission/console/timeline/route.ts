import { GET as getConsole } from "../route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return getConsole(request);
}
