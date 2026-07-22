import type { HeadlineCategory } from "@/types/headline";

export const categoryLabels: Record<HeadlineCategory, string> = {
  top: "Top Stories",
  local: "Local",
  business: "Business",
  technology: "Technology",
  science: "Science",
  health: "Health",
  politics: "Politics",
  sports: "Sports",
  entertainment: "Entertainment",
  world: "World",
};

export const categoryFallbacks: Record<HeadlineCategory, { symbol: string; label: string }> = {
  top: { symbol: "NEWS", label: "Top Story" },
  technology: { symbol: "TECH", label: "Technology" },
  business: { symbol: "BIZ", label: "Business" },
  science: { symbol: "SCI", label: "Science" },
  local: { symbol: "LOCAL", label: "Local" },
  world: { symbol: "WORLD", label: "World" },
  health: { symbol: "HEALTH", label: "Health" },
  politics: { symbol: "POL", label: "Politics" },
  sports: { symbol: "SPORT", label: "Sports" },
  entertainment: { symbol: "MEDIA", label: "Entertainment" },
};

export function mapCategory(value: string | undefined): HeadlineCategory {
  const normalized = (value ?? "top").toLowerCase().trim();
  if (normalized.includes("tech")) return "technology";
  if (normalized.includes("biz") || normalized.includes("finance") || normalized.includes("market")) return "business";
  if (normalized.includes("science")) return "science";
  if (normalized.includes("health")) return "health";
  if (normalized.includes("politic") || normalized.includes("government")) return "politics";
  if (normalized.includes("sport")) return "sports";
  if (normalized.includes("entertain") || normalized.includes("media") || normalized.includes("culture")) return "entertainment";
  if (normalized.includes("world") || normalized.includes("global") || normalized.includes("international")) return "world";
  if (normalized.includes("local") || normalized.includes("metro")) return "local";
  return "top";
}
