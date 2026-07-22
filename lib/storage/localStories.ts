export const savedStoriesStorageKey = "headline-flow:saved-story-ids:v1";
export const hiddenStoriesStorageKey = "headline-flow:hidden-story-ids:v1";

export function parseStoredIds(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}
