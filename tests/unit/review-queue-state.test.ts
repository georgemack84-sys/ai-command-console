import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  createDefaultReviewState,
  normalizeReviewState,
  buildReviewItem,
  buildReviewReply,
} = require("../../services/reviewQueueState.js");

describe("review queue state helpers", () => {
  it("creates and normalizes review state safely", () => {
    const defaults = createDefaultReviewState();
    expect(defaults.items).toEqual([]);
    expect(defaults.createdAt).toEqual(expect.any(String));
    expect(defaults.updatedAt).toEqual(expect.any(String));

    const normalized = normalizeReviewState({ createdAt: "2026-04-09T00:00:00.000Z", items: "bad" });
    expect(normalized).toEqual({
      createdAt: "2026-04-09T00:00:00.000Z",
      items: [],
    });
  });

  it("builds review items and replies from task data", () => {
    const item = buildReviewItem({
      id: "task_1",
      agentName: "researcher",
      description: "Review the findings",
      result: { ok: true },
      callback: { callbackMessageId: "message_1" },
    });

    expect(item).toEqual(
      expect.objectContaining({
        taskId: "task_1",
        agentName: "researcher",
        taskDescription: "Review the findings",
        taskResult: { ok: true },
        callbackMessageId: "message_1",
        status: "pending",
        reviewReply: {
          sent: false,
          replyType: null,
          messageId: null,
          sentAt: null,
        },
      }),
    );
    expect(item.id).toMatch(/^review_/);

    expect(buildReviewReply("approved", "reply_1")).toEqual(
      expect.objectContaining({
        sent: true,
        replyType: "approved",
        messageId: "reply_1",
        sentAt: expect.any(String),
      }),
    );
  });
});
