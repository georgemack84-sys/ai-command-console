import { z } from "zod";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

export const nuruDiscoverTopicPreferencesSchema = z.object({
  topics: z.array(z.string().trim().min(1).max(80)).max(20),
});
export type NuruDiscoverTopicPreferences = z.infer<typeof nuruDiscoverTopicPreferencesSchema>;

function normalizedTopics(topics: string[]) {
  return [...new Set(topics.map((topic) => topic.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

export async function getNuruDiscoverTopicPreferences(userId: string) {
  const rows = await nuruKnowledgeRepository.nuruDiscoverTopicPreference.findMany({
    where: { userId },
    orderBy: { topic: "asc" },
  });
  return rows.map((row) => row.topic);
}

/** Replaces only the current user's explicit, private Discover topic choices. */
export async function setNuruDiscoverTopicPreferences(userId: string, rawInput: NuruDiscoverTopicPreferences) {
  const input = nuruDiscoverTopicPreferencesSchema.parse(rawInput);
  const topics = normalizedTopics(input.topics);
  await nuruKnowledgeRepository.$transaction(async (tx) => {
    await tx.nuruDiscoverTopicPreference.deleteMany({ where: { userId } });
    if (topics.length) {
      await tx.nuruDiscoverTopicPreference.createMany({
        data: topics.map((topic) => ({ userId, topic })),
      });
    }
  });
  return topics;
}
