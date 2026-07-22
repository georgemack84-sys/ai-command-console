import type { CapabilityDescriptor } from "@/lib/civitas/types";

const capabilityNames = [
  "News Ingestion",
  "Headline Normalization",
  "Duplicate Detection",
  "Story Ranking",
  "Image Resolution",
  "Visual Rendering",
  "Presentation Mode",
  "Saved Stories",
  "Category Channels",
  "Source Reputation",
  "Trust Evaluation",
  "Story Recommendation",
  "News Brief Generation",
  "Breaking News Detection",
  "Alert Management",
] as const;

export function getCapabilityRegistry(): CapabilityDescriptor[] {
  return capabilityNames.map((name, index) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const planned = ["story-recommendation", "news-brief-generation", "breaking-news-detection", "alert-management"].includes(id);
    return {
      id,
      version: planned ? "0.1.0" : "1.0.0",
      dependencies: index < 2 ? [] : ["news-ingestion"],
      owner: "headline-flow",
      status: planned ? "planned" : "enabled",
      health: planned ? "warning" : "ok",
      inputs: id === "saved-stories" ? ["headlineId", "localStorage"] : ["headline", "configuration"],
      outputs: id.includes("ranking") ? ["rankedHeadline"] : ["capabilityResult"],
    };
  });
}
