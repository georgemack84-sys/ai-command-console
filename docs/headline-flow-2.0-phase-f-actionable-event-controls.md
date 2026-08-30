# Headline Flow 2.0 Phase F: Actionable Event Controls

## Status

Phase F turns event continuity into an actionable briefing workflow. Users can now save, mute, resolve, restore, and unmute events through persisted user/workspace preferences.

## What It Adds

- `HeadlineFlowEventPreference` Prisma model.
- Additive migration: `202608290005_headline_flow_event_preferences`.
- User-scoped event preference repository.
- Event action endpoint: `/api/headline-flow/events/[eventId]/action`.
- Event detail responses include the current user's preference summary.
- Feed filtering hides muted or user-resolved events.
- Story packages include `userPreference` when event preferences are available.
- Timeline drawer includes event controls:
  - Save event
  - Unsave event
  - Mute
  - Unmute
  - Resolve
  - Restore
- Feed diagnostics include hidden-event counts.

## Local Verification

- Prisma schema validation passed.
- Migration deploy passed locally.
- Prisma client generation passed.
- Headline Flow unit suite passed.
- Scoped lint passed.
- Typecheck passed.
- API smoke test confirmed save, mute, filtered feed hiding, and unmute.
- Desktop and mobile Playwright acceptance passed, including event controls.

## Next Recommendation

Phase G should make the action layer more useful at briefing scale:

- Add a saved-events view backed by server preferences instead of local storage.
- Add a muted/resolved management view.
- Add a "changed since last briefing" queue.
- Add event-action audit records for production observability.
