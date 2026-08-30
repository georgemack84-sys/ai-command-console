# Headline Flow 2.0 Phase O - Interaction Personalization

## Summary

Phase O closes the loop between interaction analytics and briefing order. Headline Flow now uses recent interaction history to adjust ranking, while keeping the effect bounded and visible in diagnostics.

## Changes

- Added 7-day interaction summaries to feed ranking inputs.
- Added interaction topic boosts from recent topic, story, source, and save activity.
- Added muted-topic penalties for topics the operator has muted.
- Added cache-key revisioning so interaction changes can affect refreshed feed order.
- Expanded personalization diagnostics with interaction event counts, interaction topic weights, muted topic weights, and penalized story counts.
- Updated the diagnostics drawer to show interaction weights separately from saved-event weights.
- Added unit coverage for interaction-based boosting and muted-topic dampening.

## Bounds

- Positive personalization remains capped at `+18`.
- Muted-topic penalties are capped at `-18`.
- Saved event preferences remain stronger than passive interactions.

## Verification

- `npm run typecheck`
- `npx vitest run --config vitest.config.mjs tests/unit/headline-flow/core-pipeline.test.ts tests/unit/headline-flow/feed-route.test.ts tests/unit/headline-flow/interaction-events.test.ts`
- `npx eslint app/api/headline-flow/feed/route.ts src/server/headline-flow/application/build-feed.ts src/server/headline-flow/domain/types.ts src/components/headline-flow/headline-flow-client.tsx tests/unit/headline-flow/core-pipeline.test.ts tests/unit/headline-flow/feed-route.test.ts`
