import { subscribeToContext } from "../../../../lib/context/context-events";
import { requireHouseholdAccess } from "../../../../lib/self-hosted/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = requireHouseholdAccess(request); if (unauthorized) return unauthorized;
  const stream = new ReadableStream({
    start(controller) {
      const encode = (event: string) => controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: {}\n\n`));
      encode("connected");
      const unsubscribe = subscribeToContext(() => encode("context-updated"));
      request.signal.addEventListener("abort", () => { unsubscribe(); controller.close(); }, { once: true });
    }
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}
