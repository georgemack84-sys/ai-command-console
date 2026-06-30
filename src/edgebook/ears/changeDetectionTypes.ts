export type MovementDirection = "UP" | "DOWN" | "FLAT";

export interface ChangeEvent {
  change_event_id: string;
  market_id: string;
  previous_value: number | null;
  new_value: number | null;
  movement_size: number;
  movement_direction: MovementDirection;
  price_delta: number;
  velocity: number;
  frequency: number;
  change_percentage: number;
  timestamp: string;
  source_id: string;
  ownership_hash: string;
}
