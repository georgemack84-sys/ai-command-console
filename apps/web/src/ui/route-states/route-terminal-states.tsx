'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { EmptyState, ErrorState } from '@/ui/components';

export interface RouteErrorStateProps {
  onRetry: () => void;
  recoveryHref?: string;
  recoveryLabel?: string;
  title?: string;
  description?: string;
  focusOnMount?: boolean;
}

export function RouteErrorState({
  onRetry,
  recoveryHref = '/',
  recoveryLabel = 'Return home',
  title = 'Something went wrong',
  description = "We couldn't load this page. Try again or return to a safe location.",
  focusOnMount = true,
}: RouteErrorStateProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);

  return (
    <div className="route-state">
      <ErrorState
        headingLevel={1}
        headingRef={headingRef}
        title={title}
        description={description}
        onRetry={onRetry}
        secondaryAction={
          <Link
            className="ui-button route-state__link"
            data-variant="secondary"
            data-size="medium"
            href={recoveryHref}
          >
            {recoveryLabel}
          </Link>
        }
      />
    </div>
  );
}

export interface RouteNotFoundStateProps {
  recoveryHref?: string;
  recoveryLabel?: string;
  title?: string;
  description?: string;
  focusOnMount?: boolean;
}

export function RouteNotFoundState({
  recoveryHref = '/',
  recoveryLabel = 'Return home',
  title = 'Page not found',
  description = "The page you requested doesn't exist or may have moved.",
  focusOnMount = true,
}: RouteNotFoundStateProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);

  return (
    <div className="route-state">
      <EmptyState
        headingLevel={1}
        headingRef={headingRef}
        title={title}
        description={description}
        action={
          <Link
            className="ui-button route-state__link"
            data-variant="primary"
            data-size="medium"
            href={recoveryHref}
          >
            {recoveryLabel}
          </Link>
        }
      />
    </div>
  );
}
