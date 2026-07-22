import { headlineCategories } from "@/types/headline";
import type { DisplayProfile, DisplayProfileId, HeadlineFlowConfiguration } from "@/lib/civitas/types";

export const displayProfiles: Record<DisplayProfileId, DisplayProfile> = {
  desktop: { id: "desktop", typography: "standard", spacing: "comfortable", imageRatio: "16:10", transitionSpeedMs: 220, controls: "full" },
  tablet: { id: "tablet", typography: "standard", spacing: "comfortable", imageRatio: "4:3", transitionSpeedMs: 220, controls: "full" },
  phone: { id: "phone", typography: "standard", spacing: "compact", imageRatio: "16:9", transitionSpeedMs: 180, controls: "essential" },
  tv: { id: "tv", typography: "television", spacing: "broadcast", imageRatio: "16:9", transitionSpeedMs: 260, controls: "essential" },
  kiosk: { id: "kiosk", typography: "television", spacing: "broadcast", imageRatio: "16:9", transitionSpeedMs: 260, controls: "essential" },
  "raspberry-pi": { id: "raspberry-pi", typography: "large", spacing: "comfortable", imageRatio: "16:9", transitionSpeedMs: 160, controls: "minimal" },
  "command-center": { id: "command-center", typography: "television", spacing: "broadcast", imageRatio: "21:9", transitionSpeedMs: 220, controls: "full" },
  "mission-control": { id: "mission-control", typography: "television", spacing: "broadcast", imageRatio: "21:9", transitionSpeedMs: 220, controls: "full" },
};

export function getHeadlineFlowConfiguration(): HeadlineFlowConfiguration {
  const civitasEnabled = process.env.HEADLINE_FLOW_CIVITAS_ENABLED === "true";
  const trustEnabled = process.env.HEADLINE_FLOW_TRUST_ENABLED === "true";
  const provingEnabled = process.env.HEADLINE_FLOW_PROVING_ENABLED !== "false";
  const profile = (process.env.HEADLINE_FLOW_DISPLAY_PROFILE || "desktop") as DisplayProfileId;

  return {
    mode: civitasEnabled ? "civitas" : "local",
    providers: {
      news: process.env.NEWS_PROVIDERS || process.env.NEWS_PROVIDER || "mock",
      image: process.env.HEADLINE_FLOW_IMAGE_PROVIDER || "local",
      trust: process.env.HEADLINE_FLOW_TRUST_PROVIDER || "local",
    },
    categories: [...headlineCategories],
    featureFlags: {
      civitasIntegration: civitasEnabled,
      cafAgents: process.env.HEADLINE_FLOW_CAF_ENABLED === "true",
      trustEvaluation: trustEnabled,
      provingEvidence: provingEnabled,
      operationsDashboard: process.env.HEADLINE_FLOW_DASHBOARD_ENABLED !== "false",
      recommendations: process.env.HEADLINE_FLOW_RECOMMENDATIONS_ENABLED === "true",
      briefing: process.env.HEADLINE_FLOW_BRIEFING_ENABLED === "true",
      voiceNarration: process.env.HEADLINE_FLOW_VOICE_ENABLED === "true",
    },
    trust: { enabled: trustEnabled, provider: trustEnabled && civitasEnabled ? "cata" : "local" },
    caf: { enabled: process.env.HEADLINE_FLOW_CAF_ENABLED === "true", agentRuntime: civitasEnabled ? "civitas" : "local" },
    presentation: { defaultDisplayProfile: displayProfiles[profile] ? profile : "desktop" },
    replay: { enabled: provingEnabled },
    qualification: { enabled: provingEnabled },
    telemetry: { enabled: process.env.HEADLINE_FLOW_TELEMETRY_ENABLED !== "false" },
    dashboard: { enabled: process.env.HEADLINE_FLOW_DASHBOARD_ENABLED !== "false", route: "/civitas" },
    theme: { name: "broadcast-navy" },
    displayProfile: displayProfiles[profile] ? profile : "desktop",
  };
}
