import type { Headline } from "@/types/headline";
import type { StoryTrust, TrustProvider, TrustStanding } from "@/lib/civitas/types";

const sourceReputation: Record<string, number> = {
  "Mock Headline Flow": 91,
  "Mock Technology Review": 86,
  "Mock Health Ledger": 83,
  "Mock World Service": 80,
};

export class LocalTrustProvider implements TrustProvider {
  async evaluate(story: Headline): Promise<StoryTrust> {
    const reputation = sourceReputation[story.source.name] ?? 72;
    const imageBonus = story.image ? 4 : 0;
    const confidence = Math.max(35, Math.min(98, Math.round(reputation * 0.72 + story.freshnessScore * 0.18 + imageBonus)));
    const misinformationRisk = Math.max(1, Math.round(100 - confidence));
    const trustStanding: TrustStanding = confidence >= 72 ? "NOMINAL" : confidence >= 55 ? "DEGRADED" : "UNKNOWN";
    return {
      trustStanding,
      confidence,
      evidenceCount: story.image ? 3 : 2,
      sourceReputation: reputation,
      misinformationRisk,
      explanation: `Local trust evaluation combines source reputation, freshness, and visual evidence. ${story.source.name} is currently scored at ${reputation}.`,
      evaluatedAt: new Date().toISOString(),
      history: [{ standing: trustStanding, at: new Date().toISOString(), reason: "Local mock-mode evaluation" }],
    };
  }
}

export async function evaluateStoryTrust(stories: Headline[], enabled: boolean) {
  if (!enabled) return stories;
  const provider = new LocalTrustProvider();
  return Promise.all(stories.map(async (story) => ({ ...story, trust: await provider.evaluate(story) })));
}
