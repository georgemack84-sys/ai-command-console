import { Skeleton } from '@/ui/components';

export interface RouteLoadingStateProps {
  label?: string;
  blocks?: number;
}

export function RouteLoadingState({
  label = 'Loading page…',
  blocks = 3,
}: RouteLoadingStateProps) {
  const blockKeys = Array.from(
    { length: Math.max(1, blocks) },
    (_, index) => `route-loading-block-${index + 1}`,
  );

  return (
    <section className="route-state route-loading-state" aria-busy="true">
      <p className="sr-only" role="status">
        {label}
      </p>
      <div className="route-loading-state__header" aria-hidden="true">
        <Skeleton shape="text" className="route-loading-state__title" />
        <Skeleton shape="text" className="route-loading-state__description" />
      </div>
      <div className="route-loading-state__blocks" aria-hidden="true">
        {blockKeys.map((key) => (
          <div className="route-loading-state__block" key={key}>
            <Skeleton shape="text" />
            <Skeleton />
          </div>
        ))}
      </div>
    </section>
  );
}
