import { buildOverview, queueDueDigestSweepIfNeeded } from "../core";
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
  const context = {
    userId: user?.id || "demo",
    workspaceId: user?.workspaceId || "default",
    userName: user?.name || user?.email || "Demo User",
    userRole: user?.role || "admin",
  };
  let stopStream = () => {};
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let timer: ReturnType<typeof setInterval> | null = null;

      const stop = () => {
        closed = true;
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      };
      stopStream = stop;

      const push = () => {
        if (closed) {
          return;
        }

        queueDueDigestSweepIfNeeded(context.workspaceId, {
          actorId: context.userId,
          actorName: context.userName,
        });

        try {
          controller.enqueue(
            new TextEncoder().encode(
              encodeEvent(
                {
                  ok: true,
                  overview: buildOverview(context),
                  sentAt: new Date().toISOString(),
                },
                "overview"
              )
            )
          );
        } catch {
          stop();
        }
      };

      push();
      timer = setInterval(push, 4000);

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
