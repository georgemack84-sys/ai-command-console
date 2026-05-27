import { describe, expect, it } from "vitest";

import { SamPriorityQueue } from "../../services/sam/scaling/samPriorityQueue.ts";

describe("sam priority queue", () => {
  it("orders work by the declared runtime priority", () => {
    const queue = new SamPriorityQueue<string>();
    queue.enqueue({ value: "chaos", priority: "chaos", id: "1" });
    queue.enqueue({ value: "audit", priority: "audit", id: "2" });
    queue.enqueue({ value: "recovery", priority: "recovery", id: "3" });
    queue.enqueue({ value: "advisory", priority: "advisory", id: "4" });

    expect(queue.dequeue()?.value).toBe("recovery");
    expect(queue.dequeue()?.value).toBe("audit");
    expect(queue.dequeue()?.value).toBe("advisory");
    expect(queue.dequeue()?.value).toBe("chaos");
  });
});
