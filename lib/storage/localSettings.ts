import { z } from "zod";

export const headlineFlowSettingsSchema = z.object({
  version: z.literal(1),
  slideDurationSeconds: z.number().int().min(5).max(60),
  defaultCategory: z.string(),
  autoplay: z.boolean(),
  showSummaries: z.boolean(),
  showTimestamps: z.boolean(),
  showImageCredits: z.boolean(),
  reducedMotion: z.boolean(),
  textScale: z.enum(["standard", "large", "television"]),
  blockedSources: z.array(z.string()),
  hiddenCategories: z.array(z.string()),
});

export type HeadlineFlowSettings = z.infer<typeof headlineFlowSettingsSchema>;

export const defaultHeadlineFlowSettings: HeadlineFlowSettings = {
  version: 1,
  slideDurationSeconds: 10,
  defaultCategory: "top",
  autoplay: true,
  showSummaries: true,
  showTimestamps: true,
  showImageCredits: true,
  reducedMotion: false,
  textScale: "standard",
  blockedSources: [],
  hiddenCategories: [],
};

export const settingsStorageKey = "headline-flow:settings:v1";

export function parseStoredSettings(value: string | null): HeadlineFlowSettings {
  if (!value) return defaultHeadlineFlowSettings;
  try {
    const parsed = headlineFlowSettingsSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : defaultHeadlineFlowSettings;
  } catch {
    return defaultHeadlineFlowSettings;
  }
}
