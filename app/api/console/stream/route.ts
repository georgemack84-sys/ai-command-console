import { getTerminalOverview, queueTerminalDigestSweep } from "../core";
import { getSessionUser } from "@/src/lib/auth";
import { ensureDigestScheduler } from "@/services/digestScheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeEvent(data: unknown, event = "message") {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  ensureDigestScheduler();
  const user = await getSessionUser();
  if (!user) {
    return new Response("Authentication required.", { status: 401 });
  }
  const context = {
    id: user.id,
    workspaceId: user.workspaceId,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  let stopStream = () => {};
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let timer: ReturnType<typeof setInterval> | null = null;
      let pushing = false;

      const stop = () => {
        closed = true;
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      };
      stopStream = stop;

      const push = async () => {
        if (closed || pushing) {
          return;
        }
        pushing = true;

        queueTerminalDigestSweep(context);

        try {
          const overview = await getTerminalOverview(context);
          if (closed) {
            return;
          }
          controller.enqueue(
            new TextEncoder().encode(
              encodeEvent(
                {
                  ok: true,
                  overview,
                  sentAt: new Date().toISOString(),
                },
                "overview"
              )
            )
          );
        } catch {
          stop();
        } finally {
          pushing = false;
        }
      };

      void push();
      timer = setInterval(() => {
        void push();
      }, 4000);

      return () => {
        stop();
      };
    },
    cancel() {
      stopStream();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
