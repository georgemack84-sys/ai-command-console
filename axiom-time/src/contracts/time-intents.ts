export type TimeIntent =
  | { type: "CREATE_ALARM"; time: string; label: string }
  | { type: "START_TIMER"; minutes: number; label: string }
  | { type: "SET_WEATHER_LOCATION"; city: string };

export interface ProposedTimeAction {
  id: string;
  intent: TimeIntent;
  createdAt: string;
  source: "text" | "voice";
  status: "PENDING" | "CONFIRMED" | "DENIED";
}
