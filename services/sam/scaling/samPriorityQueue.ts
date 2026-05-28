import type { SamWorkPriority } from "./samScalingTypes";

const PRIORITY_RANK: Record<SamWorkPriority, number> = {
  recovery: 0,
  approved: 1,
  audit: 2,
  idempotency: 3,
  retry: 4,
  advisory: 5,
  chaos: 6,
};

export type SamPriorityQueueItem<T> = {
  id: string;
  value: T;
  priority: SamWorkPriority;
};

export class SamPriorityQueue<T> {
  #items: Array<SamPriorityQueueItem<T> & { sequence: number }> = [];
  #sequence = 0;

  enqueue(item: SamPriorityQueueItem<T>) {
    this.#items.push({
      ...item,
      sequence: this.#sequence++,
    });
    this.#items.sort((a, b) => {
      const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      return rankDiff !== 0 ? rankDiff : a.sequence - b.sequence;
    });
  }

  dequeue() {
    const item = this.#items.shift();
    if (!item) {
      return undefined;
    }
    const { sequence, ...rest } = item;
    void sequence;
    return rest;
  }

  peek() {
    const item = this.#items[0];
    if (!item) {
      return undefined;
    }
    const { sequence, ...rest } = item;
    void sequence;
    return rest;
  }

  size() {
    return this.#items.length;
  }
}
