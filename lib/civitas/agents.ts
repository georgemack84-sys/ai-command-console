import type { CivitasAgent } from "@/lib/civitas/types";

class LocalCafAgent implements CivitasAgent {
  constructor(readonly id: string) {}

  async execute(input: unknown) {
    return { agentId: this.id, mode: "local", input };
  }

  async explain() {
    return `${this.id} is running locally through the Civitas Integration Layer.`;
  }

  async replay(input: unknown, replayId: string) {
    return { agentId: this.id, replayId, mode: "local", input };
  }

  async qualify() {
    return { qualified: true, evidence: [`${this.id}:local-qualified`] };
  }
}

export function getCafAgents(): CivitasAgent[] {
  return [
    "news-collector-agent",
    "news-discovery-agent",
    "rss-agent",
    "breaking-news-agent",
    "topic-classification-agent",
    "duplicate-detection-agent",
    "image-selection-agent",
    "visual-synchronization-agent",
    "headline-ranking-agent",
    "summary-agent",
    "recommendation-agent",
    "morning-briefing-agent",
    "trend-detection-agent",
    "personalization-agent",
    "alert-agent",
  ].map((id) => new LocalCafAgent(id));
}
