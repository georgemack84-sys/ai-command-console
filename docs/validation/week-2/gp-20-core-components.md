# GP-20 Core UI Component Qualification

## Scope and classification

GP-20 hardened the existing GP-19 primitive prototype into separated, documented,
and mechanically guarded component families. Foundation impact:
`FOUNDATION_COMPATIBLE`. No new styling, theme, Storybook, accessibility, or
dependency architecture was introduced.

Badge was not implemented because no admitted consumer requires it. Overlay and
shell code are outside this change. Deviations: none beyond those specification
choices explicitly permitted by the roadmap.

## Component catalog

| Component                   | Variants                                        | Sizes                               | Story          | Behavioral tests |
| --------------------------- | ----------------------------------------------- | ----------------------------------- | -------------- | ---------------- |
| Button                      | primary, secondary, outline, ghost, danger      | small, medium, large                | yes            | yes              |
| IconButton                  | Button variants                                 | Button sizes; touch target enforced | yes            | yes              |
| Label                       | native                                          | —                                   | yes, via Forms | yes, via Field   |
| Input                       | native types                                    | —                                   | yes            | yes              |
| Textarea                    | native                                          | —                                   | yes            | yes              |
| Field / description / error | valid, required, invalid, disabled compositions | —                                   | yes            | yes              |
| Card and structural parts   | default, subtle, outlined, elevated             | —                                   | yes            | yes              |
| Spinner                     | decorative or labeled                           | small, medium, large                | yes            | yes              |
| Skeleton                    | text, rectangle, circle                         | —                                   | yes            | yes              |
| LoadingState                | labeled                                         | Spinner sizes                       | yes            | yes              |
| EmptyState                  | composable visual/actions                       | —                                   | yes            | yes              |
| ErrorState                  | safe defaults, external retry/action            | —                                   | yes            | yes              |
| UnavailableState            | safe defaults, external retry/action            | —                                   | yes            | yes              |

## Accessibility and behavior evidence

- Button and IconButton use native buttons, visible shared focus treatment, native
  keyboard activation, real disabled semantics, and forwarded refs.
- Loading buttons expose `aria-busy`, prevent duplicate activation, preserve their
  content width, and provide a status label.
- Field associates native labels, descriptions, and errors; invalid controls receive
  `aria-invalid` and textual alert content.
- Decorative spinners and skeletons are hidden from accessibility APIs. LoadingState
  owns a visible status label.
- State sections receive an accessible name from their heading and never render raw
  error details automatically.
- CSS supports 320 px wrapping, forced colors, and static reduced-motion loading
  treatments.

## Controlled failures

The GP-20 fixture runner confirms that each temporary violation fails and that the
unchanged real source passes afterward:

1. Button defaults to submit.
2. IconButton label becomes optional.
3. A UI primitive imports the application shell.
4. Component CSS embeds a raw color.
5. Component CSS references an unresolved token.

The architecture suite also retains its controlled `ui-to-shell` failure fixture,
and strict TypeScript retains an expected missing-label IconButton misuse.

## Validation record

| Command                                                         | Result       | Evidence                                                                                                           |
| --------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------ |
| `npm run repo -- validate components`                           | PASS, exit 0 | 11 required artifacts and 5 controlled failures                                                                    |
| `npm run repo -- validate frontend`                             | PASS, exit 0 | formatting, policy, strict TypeScript, ESLint, 90-module architecture graph, 19 theme tests, and 69 coverage tests |
| `npm run repo -- build frontend` with the CI public environment | PASS, exit 0 | Next.js 16.2 production build and seven generated routes                                                           |
| `npm run repo -- build storybook`                               | PASS, exit 0 | Storybook 10.5.3 static build, 358 transformed modules                                                             |
| `npm run test:storybook` from `apps/web`                        | PASS, exit 0 | 8 Chromium interaction, theme, narrow-width, reduced-motion, and Axe checks                                        |
| `npm run test:browser` from `apps/web`                          | PASS, exit 0 | 14 application-shell assertions, including the shared login Button                                                 |
| `npm run repo -- validate repo`                                 | PASS, exit 0 | repository, documentation, Day 5 qualification, GP-18 baseline, and seven CI gates                                 |
| `npm run test:repository-commands`                              | PASS, exit 0 | 18 Node and PowerShell command-contract tests                                                                      |
| `npm run test:ci-workflow`                                      | PASS, exit 0 | all seven protected gate names preserved                                                                           |

The first production-build invocation intentionally had no public environment and
failed closed in `validate-environment.mjs`; the same build passed with the explicit
synthetic values required by CI. The restricted filesystem sandbox also prevented
Storybook's generated manager cache from traversing its own path. The unchanged
command passed immediately with normal host filesystem access, matching the GP-19
environment limitation. No product validation was omitted.

## Remaining risks

Manual screen-reader and high-zoom checks remain governed by the existing Week 2
accessibility evidence process; automated semantic and browser checks do not replace
that review.

`GP-20 STATUS: COMPLETE — CORE UI COMPONENT LAYER READY`
