import type { Alert, DashboardData, Incident, SavedRoute, TrafficLevel, TrafficSegment, TrafficSnapshot } from "@/src/lib/types";

export type RouteContext = {
  route: SavedRoute;
  segments: TrafficSegment[];
  incidents: Incident[];
  delayMinutes: number;
  dominantTraffic: TrafficLevel;
};

export type AssistantContext = {
  data: DashboardData;
  routes: RouteContext[];
  topAlerts: Alert[];
  recentHistory: TrafficSnapshot[];
  mostImpactedRoute: RouteContext | null;
};

export type LeaveRecommendation = {
  label: "leave now" | "leave soon" | "leave later";
  minutesUntilDeparture: number;
  confidence: "high" | "medium" | "low";
  reason: string;
};

export type RouteReasoning = {
  headline: string;
  cause: string;
  explanation: string;
  recommendation: string;
  dominantCause: "accident" | "road closure" | "construction" | "congestion" | "clear";
};

export type AlternateRouteSuggestion = {
  available: boolean;
  title: string;
  summary: string;
  candidateRouteLabel?: string;
  expectedSavingsMinutes?: number;
  recommendation: string;
};

export type RouteChangeSummary = {
  title: string;
  summary: string;
  changed: boolean;
  bullets: string[];
  recommendation: string;
};

export type ForecastSummary = {
  title: string;
  summary: string;
  forecastMinutes: number;
  trendLabel: "improving" | "steady" | "worsening";
  recommendation: string;
};

export type AssistantMemoryEntry = {
  prompt: string;
  answerTitle: string;
  answerSummary: string;
  createdAt: string;
};

export type WatchlistItem = {
  id: string;
  title: string;
  detail: string;
  tone: "watch" | "warning" | "opportunity";
};

export type AssistantAnswer = {
  title: string;
  summary: string;
  bullets: string[];
  recommendation: string;
};
