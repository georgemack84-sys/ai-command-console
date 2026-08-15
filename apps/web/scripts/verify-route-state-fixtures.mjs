import assert from 'node:assert/strict';

import { validateRouteStateFoundation } from './route-state-policy.mjs';

const valid = {
  loading: '<Skeleton aria-hidden /> role="status" aria-busy="true"',
  terminalStates:
    'ErrorState EmptyState onRetry focusOnMount recoveryHref headingLevel={1}',
  styles:
    '.route-state-standalone{} .route-loading-state__blocks{} .route-state .ui-empty-state__actions{width: 100%} @media (max-width: 24rem){}',
  stories:
    'export const Loading: export const LongLoading: export const RecoverableError: export const ErrorWithLongCopy: export const NotFound: export const NotFoundWithLongCopy:',
  rootLoading: '<main><RouteLoadingState /></main>',
  rootError: '<main><RouteErrorState /></main>',
  rootNotFound: '<main><RouteNotFoundState /></main>',
  protectedLoading: '<RouteLoadingState />',
  protectedError: '<RouteErrorState />',
  protectedNotFound: '<RouteNotFoundState />',
  globalError:
    '<html><body><main><button onClick={reset}>Retry</button></main></body></html>',
  tokens: '',
};
const fixtures = [
  {
    name: 'raw exception exposure',
    mutate: (value) => ({
      ...value,
      rootError: '<main>{error.message}</main>',
    }),
    expected: 'raw error details',
  },
  {
    name: 'duplicate protected main',
    mutate: (value) => ({
      ...value,
      protectedError: '<main><RouteErrorState /></main>',
    }),
    expected: 'duplicates the ApplicationShell main landmark',
  },
  {
    name: 'loading focus theft',
    mutate: (value) => ({ ...value, loading: `${value.loading}.focus()` }),
    expected: 'loading must not move focus',
  },
  {
    name: 'nested hard reload',
    mutate: (value) => ({
      ...value,
      protectedError: `${value.protectedError}window.location.reload()`,
    }),
    expected: 'full reload is not a route retry',
  },
  {
    name: 'missing not-found story',
    mutate: (value) => ({
      ...value,
      stories: value.stories.replace('export const NotFound:', ''),
    }),
    expected: 'missing NotFound story',
  },
];

for (const fixture of fixtures) {
  const errors = validateRouteStateFoundation(fixture.mutate(valid));
  assert.ok(
    errors.some((error) => error.includes(fixture.expected)),
    `${fixture.name} did not fail with ${fixture.expected}: ${errors.join('; ')}`,
  );
}
console.log(
  `Route-state controlled failures: PASS (${fixtures.length} rejected fixtures)`,
);
