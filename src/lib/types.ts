export type TrafficLevel = "light" | "moderate" | "heavy";

export type IncidentType = "accident" | "road closure" | "construction";

export type AlertType = "delay warning" | "incident detected" | "best time to leave";

export type UserRole = "viewer" | "operator" | "approver" | "admin";
export type UserStatus = "active" | "disabled";

export type UserAccount = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  workspaceId: string;
  workspaceName: string;
  createdAt: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  workspaceId: string;
  workspaceName: string;
};

export type TrafficSegment = {
  id: string;
  name: string;
  start: string;
  end: string;
  status: TrafficLevel;
  speedMph: number;
  averageSpeedMph: number;
  travelTimeMinutes: number;
  normalTimeMinutes: number;
  coordinates: { x: number; y: number }[];
  geoCoordinates?: [number, number][];
  corridor: string;
  trend: "improving" | "stable" | "worsening";
};

export type Incident = {
  id: string;
  type: IncidentType;
  title: string;
  impact: "minor" | "moderate" | "major";
  segmentId: string;
  location: string;
  description: string;
  reportedAt: string;
  coordinate: { x: number; y: number };
  geoCoordinate?: [number, number];
  active: boolean;
};

export type SavedRoute = {
  id: string;
  label: string;
  origin: string;
  destination: string;
  segmentIds: string[];
  currentTimeMinutes: number;
  normalTimeMinutes: number;
  lastUpdated: string;
  ownerId?: string;
  ownerName?: string;
  routeGeometry?: [number, number][];
  originCoordinate?: [number, number];
  destinationCoordinate?: [number, number];
};

export type Alert = {
  id: string;
  routeId: string;
  title: string;
  severity: "info" | "warning" | "critical";
  type: AlertType;
  detail: string;
  travelDeltaMinutes: number;
  incidentIds: string[];
  updatedAt: string;
  rank: number;
};

export type UserSettings = {
  theme: "system" | "light";
  refreshInterval: string;
  alertsEnabled: boolean;
  mapAnimation: boolean;
  routeBufferMinutes: number;
};

export type IntegrationStatus = {
  mapbox: boolean;
  tomtom: boolean;
  routing: "mapbox" | "mock";
  traffic: "tomtom" | "simulation";
  storage: "file";
};

export type RouteAlternative = {
  id: string;
  label: string;
  currentTimeMinutes: number;
  normalTimeMinutes: number;
  delayMinutes: number;
  routeGeometry: [number, number][];
  originCoordinate: [number, number];
  destinationCoordinate: [number, number];
  provider: "mapbox" | "simulated";
  summary: string;
};

export type RouteEstimate = {
  id: string;
  label: string;
  origin: string;
  destination: string;
  currentTimeMinutes: number;
  normalTimeMinutes: number;
  delayMinutes: number;
  status: TrafficLevel;
  segmentIds: string[];
  incidents: Incident[];
  summary: string;
  routeGeometry?: [number, number][];
  originCoordinate?: [number, number];
  destinationCoordinate?: [number, number];
  usedRealGeometry?: boolean;
  alternativeRoutes?: RouteAlternative[];
};

export type TrafficSnapshot = {
  timestamp: string;
  averageCommuteMinutes: number;
  byTimeOfDay: "Morning" | "Midday" | "Evening" | "Night";
  dayOfWeek: string;
  routeMetrics: Array<{
    routeId: string;
    routeLabel: string;
    delayMinutes: number;
    currentTimeMinutes: number;
    normalTimeMinutes: number;
  }>;
  congestedSegments: Array<{
    segmentId: string;
    segmentName: string;
    status: TrafficLevel;
  }>;
};

export type InsightData = {
  commuteByTimeOfDay: Array<{ label: string; minutes: number }>;
  commuteByDayOfWeek: Array<{ label: string; minutes: number }>;
  routeCongestion: Array<{ label: string; averageDelay: number }>;
  delayTrend: Array<{ label: string; delay: number }>;
};

export type DashboardData = {
  users: Array<{ id: string; name: string; homeCity: string }>;
  trafficSegments: TrafficSegment[];
  incidents: Incident[];
  savedRoutes: SavedRoute[];
  alerts: Alert[];
  integrationStatus: IntegrationStatus;
  insights: InsightData;
  lastUpdated: string;
  simulationMode: "live-simulated" | "provider-assisted";
};

export type TrafficState = {
  lastSimulationAt: string;
  trafficSegments: TrafficSegment[];
  incidents: Incident[];
  history: TrafficSnapshot[];
};

export type ResearchBriefStatus = "draft" | "queued" | "in_progress" | "in_review" | "complete";

export type ResearchPriority = "low" | "medium" | "high";

export type ResearchBrief = {
  id: string;
  title: string;
  question: string;
  status: ResearchBriefStatus;
  priority: ResearchPriority;
  assignedAgent: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  ownerName?: string;
  summary: string;
  linkedTaskId?: string | null;
};

export type ResearchReport = {
  id: string;
  briefId: string;
  title: string;
  format: "memo" | "briefing" | "comparison" | "outline";
  status: "draft" | "ready" | "published";
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  ownerName?: string;
  excerpt: string;
  keyFindings: string[];
};
