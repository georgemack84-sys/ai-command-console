import type { ChangeEvent } from "../ears/changeDetectionTypes";

export function MarketMovementFeed({ events }: { events: ChangeEvent[] }) {
  return (
    <section>
      <h2>Market Movement</h2>
      <ul>
        {events.map((event) => (
          <li key={event.change_event_id}>{event.movement_direction}</li>
        ))}
      </ul>
    </section>
  );
}
