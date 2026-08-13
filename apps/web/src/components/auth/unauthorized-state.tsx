import Link from 'next/link';

import { EmptyState } from '@/ui/components/primitives';
export function UnauthorizedState() {
  return (
    <EmptyState
      title="Access unavailable"
      description="You do not have access to this area."
      primaryAction={
        <Link className="ui-button" href="/">
          Return to home
        </Link>
      }
    />
  );
}
